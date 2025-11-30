import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset request API called');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ message: 'Please enter a valid email address' }, { status: 400 });
    }

    // Check if user exists
    const users = await sql`
      SELECT id, name, email FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({ 
        message: 'If an account with that email exists, we\'ve sent a password reset link.' 
      });
    }

    const user = users[0];
    
    // Check if user is a demo account (temporarily disabled for testing)
    // const isDemoAccount = user.email.includes('farmerindi') || 
    //                      user.email.includes('farmerbiz') ||
    //                      user.email.includes('traderindi') ||
    //                      user.email.includes('traderbiz') ||
    //                      user.email.includes('buyerindi') ||
    //                      user.email.includes('buyerbiz') ||
    //                      user.email.includes('buyer@example.com') ||
    //                      user.email.includes('admin@agrilink.com');

    // if (isDemoAccount) {
    //   return NextResponse.json({ 
    //     message: 'Demo accounts cannot reset passwords. Please use the provided demo credentials.' 
    //   }, { status: 400 });
    // }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save reset token to email_management table
    // Check if record exists and update only password reset fields
    const existingRecord = await sql`
      SELECT id FROM email_management WHERE "userId" = ${user.id}
    `;
    
    if (existingRecord.length > 0) {
      // Update existing record with password reset token
      await sql`
        UPDATE email_management 
        SET 
          "passwordResetToken" = ${resetToken},
          "passwordResetExpires" = ${expiresAt.toISOString()},
          "updatedAt" = NOW()
        WHERE "userId" = ${user.id}
      `;
    } else {
      // Insert new record
      await sql`
        INSERT INTO email_management (id, "userId", "passwordResetToken", "passwordResetExpires", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${user.id}, ${resetToken}, ${expiresAt.toISOString()}, NOW(), NOW())
      `;
    }

    console.log('✅ Password reset token generated for user:', user.email);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Always log the reset URL for testing
    console.log('🔗 RESET URL FOR TESTING:', resetUrl);
    
    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
              const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
        from: 'AgriLink <noreply@hthheh.com>',
          to: [user.email],
          subject: 'Reset Your AgriLink Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Reset Your Password</h2>
              <p>Hello ${user.name},</p>
              <p>We received a request to reset your password for your AgriLink account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This email was sent from AgriLink. If you have any questions, please contact our support team.
              </p>
            </div>
          `
        });
        
        console.log('✅ Password reset email sent to:', user.email);
        console.log('📧 Email details:', {
          from: 'AgriLink <noreply@hthheh.com>',
          to: user.email,
          subject: 'Reset Your AgriLink Password'
        });
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError);
        console.error('❌ Email error details:', JSON.stringify(emailError, null, 2));
        // Don't fail the request if email sending fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email send');
      // For testing: log the reset URL to console
      console.log('🔗 Reset URL for testing:', resetUrl);
    }

    return NextResponse.json({ 
      message: 'If an account with that email exists, we\'ve sent a password reset link.',
      // For development, include the token
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken, 
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      })
    });

  } catch (error: any) {
    console.error('❌ Password reset request error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { message: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
