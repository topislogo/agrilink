import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  try {
    console.log('📧 Resend verification email API called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get user data
    console.log('🔍 Resend verification - Fetching user data for userId:', userId);
    const userResult = await sql`
      SELECT id, email, name, "emailVerified", "emailVerificationExpires"
      FROM users 
      WHERE id = ${userId}
    `;
    console.log('📊 Resend verification - User data result:', userResult);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        message: 'Email is already verified',
        alreadyVerified: true
      });
    }

    // Simple rate limiting: only check if verification token is very recent (within 10 seconds)
    // This prevents immediate spam while allowing reasonable resend attempts
    if (user.emailVerificationExpires) {
      const tokenCreatedTime = new Date(user.emailVerificationExpires).getTime() - (24 * 60 * 60 * 1000); // Subtract 24 hours to get creation time
      const tenSecondsAgo = Date.now() - (10 * 1000);
      
      if (tokenCreatedTime > tenSecondsAgo) {
        return NextResponse.json({ 
          message: 'Verification email was recently sent. Please wait 10 seconds before requesting another.',
          recentlySent: true
        }, { status: 429 });
      }
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('🔑 Resend verification - Generated new token:', verificationToken.substring(0, 8) + '...');
    console.log('⏰ Resend verification - Token expires at:', expiresAt.toISOString());

    // Update user with new verification token
    console.log('💾 Resend verification - Updating user with new token...');
    await sql`
      UPDATE users 
      SET 
        "emailVerificationToken" = ${verificationToken},
        "emailVerificationExpires" = ${expiresAt.toISOString()},
        "updatedAt" = NOW()
      WHERE id = ${userId}
    `;
    console.log('✅ Resend verification - User updated successfully');

    console.log('✅ New verification token generated for user:', user.email);

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    console.log('🔗 Verification URL:', verificationUrl);

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
              <h2 style="color: #16a34a;">Verify Your AgriLink Account</h2>
              <p>Hello ${user.name},</p>
              <p>You requested a new verification email. Please click the button below to verify your email address:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't request this verification email, you can safely ignore it.
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This email was sent from AgriLink. If you have any questions, please contact our support team.
              </p>
            </div>
          `
        });
        
        console.log('✅ Verification email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail the request if email sending fails
      }
    } else {
      console.log('⚠️ Resend API key not configured, skipping email send');
      console.log('🔗 VERIFICATION URL FOR TESTING:', verificationUrl);
    }

    return NextResponse.json({ 
      message: 'Verification email sent successfully',
      email: user.email
    });

  } catch (error: any) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
