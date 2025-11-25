import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  try {
    console.log('📧 Send verification email API called');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ message: 'Please enter a valid email address' }, { status: 400 });
    }

    // Find user by email
    const userData = await sql`
      SELECT id, name, email, email_verified, email_verification_token
      FROM users 
      WHERE email = ${email}
    `;

    if (userData.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userData[0];

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 400 });
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Save verification token to database
    await sql`
      UPDATE users 
      SET 
        email_verification_token = ${verificationToken},
        email_verification_expires = ${expiresAt.toISOString()}
      WHERE id = ${user.id}
    `;

    console.log('✅ Email verification token generated for user:', user.email);

    // Create verification URL - use environment variable for URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    console.log('🔗 Using base URL:', baseUrl);
    
    // Always log the verification URL for testing
    console.log('🔗 VERIFICATION URL FOR TESTING:', verificationUrl);
    
    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
                const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'AgriLink <noreply@hthheh.com>',
          to: [user.email],
          subject: 'Verify Your AgriLink Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Welcome to AgriLink!</h2>
              <p>Hello ${user.name},</p>
              <p>Thank you for joining AgriLink! To complete your registration, please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't create an account with AgriLink, you can safely ignore this email.
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This email was sent from AgriLink. If you have any questions, please contact our support team.
              </p>
            </div>
          `
        });
        
        console.log('✅ Email verification email sent to:', user.email);
        console.log('📧 Email details:', {
          from: 'AgriLink <noreply@hthheh.com>',
          to: user.email,
          subject: 'Verify Your AgriLink Account'
        });
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        console.error('❌ Email error details:', JSON.stringify(emailError, null, 2));
        // Don't fail the request if email sending fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email send');
      // For testing: log the verification URL to console
      console.log('🔗 Verification URL for testing:', verificationUrl);
    }

    return NextResponse.json({ 
      message: 'Verification email sent successfully',
      verificationToken: verificationToken,
      verificationUrl: verificationUrl
    });

  } catch (error: any) {
    console.error('❌ Send verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}