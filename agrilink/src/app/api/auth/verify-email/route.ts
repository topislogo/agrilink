import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('✅ Verify email API called');
    
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ message: 'Verification token is required' }, { status: 400 });
    }

    // Find user by verification token
    const userData = await sql`
      SELECT id, name, email, "emailVerified", "emailVerificationExpires"
      FROM users 
      WHERE "emailVerificationToken" = ${token}
    `;

    if (userData.length === 0) {
      return NextResponse.json({ message: 'Invalid verification token' }, { status: 400 });
    }

    const user = userData[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        message: 'Email is already verified',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: true
        }
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(user.emailVerificationExpires);
    
    if (now > expiresAt) {
      return NextResponse.json({ message: 'Verification token has expired' }, { status: 400 });
    }

    // Verify the email
    await sql`
      UPDATE users 
      SET 
        "emailVerified" = true,
        "emailVerificationToken" = NULL,
        "emailVerificationExpires" = NULL,
        "updatedAt" = NOW()
      WHERE id = ${user.id}
    `;

    console.log('✅ Email verified successfully for user:', user.email);

    return NextResponse.json({ 
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true
      }
    });

  } catch (error: any) {
    console.error('❌ Verify email error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}