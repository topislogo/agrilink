import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset API called');
    
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ 
        message: 'Reset token and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        message: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    // Look up token in email_management and join to the user
    const rows = await sql`
      SELECT em."userId" as "userId", u.email as "userEmail", em."passwordResetExpires" as "passwordResetExpires"
      FROM email_management em
      JOIN users u ON u.id = em."userId"
      WHERE em."passwordResetToken" = ${token}
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    const { userId, userEmail, passwordResetExpires } = rows[0] as unknown as {
      userId: string;
      userEmail: string;
      passwordResetExpires: string | null;
    };

    // Check if token is expired
    const now = new Date();
    const expiresAt = passwordResetExpires ? new Date(passwordResetExpires) : null;
    
    if (!expiresAt || now > expiresAt) {
      // Clear expired token
      await sql`
        UPDATE email_management 
        SET 
          "passwordResetToken" = NULL,
          "passwordResetExpires" = NULL,
          "updatedAt" = NOW()
        WHERE "userId" = ${userId}
      `;
      return NextResponse.json({
        message: 'Reset token has expired. Please request a new password reset.'
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await sql`
      UPDATE users 
      SET 
        "passwordHash" = ${hashedPassword},
        "updatedAt" = NOW()
      WHERE id = ${userId}
    `;

    // Clear token from email_management
    await sql`
      UPDATE email_management
      SET 
        "passwordResetToken" = NULL,
        "passwordResetExpires" = NULL,
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    console.log('✅ Password reset successfully for user:', userEmail);

    return NextResponse.json({ 
      message: 'Password has been reset successfully. You can now sign in with your new password.' 
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
