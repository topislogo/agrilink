import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('✅ Verify email change API called');
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'No verification token provided' }, { status: 400 });
    }

    // Find email change request with this token
    const emailRequests = await sql`
      SELECT em."userId", em."pendingEmail", em."emailVerificationExpires", u.email, u.name
      FROM email_management em
      JOIN users u ON em."userId" = u.id
      WHERE em."emailVerificationToken" = ${token}
    `;

    if (emailRequests.length === 0) {
      return NextResponse.json({ message: 'Invalid verification token' }, { status: 400 });
    }

    const emailRequest = emailRequests[0];

    if (!emailRequest.pendingEmail) {
      return NextResponse.json({ message: 'No pending email change found' }, { status: 400 });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(emailRequest.emailVerificationExpires);
    
    if (now > expiresAt) {
      // Clear expired token
      await sql`
        DELETE FROM email_management 
        WHERE "userId" = ${emailRequest.userId}
      `;
      
      return NextResponse.json({ message: 'Verification token has expired' }, { status: 400 });
    }

    // Update the email and clear the verification data
    await sql`
      UPDATE users 
      SET 
        email = ${emailRequest.pendingEmail},
        "updatedAt" = NOW()
      WHERE id = ${emailRequest.userId}
    `;

    // Clear the email change request
    await sql`
      DELETE FROM email_management 
      WHERE "userId" = ${emailRequest.userId}
    `;

    console.log('✅ Email changed successfully for user:', emailRequest.userId, 'from', emailRequest.email, 'to', emailRequest.pendingEmail);

    return NextResponse.json({
      message: 'Email address updated successfully!',
      user: {
        id: emailRequest.userId,
        name: emailRequest.name,
        email: emailRequest.pendingEmail,
      },
    });

  } catch (error: any) {
    console.error('❌ Email change verification error:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}