import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { Resend } from 'resend';


export async function POST(request: NextRequest) {
  console.log('🚀 UPDATE EMAIL API ENTRY POINT REACHED');
  try {
    console.log('📧 Update email API called');
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token
    let userId: string;
    try {
      if (!process.env.JWT_SECRET!) {
        return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
      }
      
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
        console.log('🔐 JWT decoded successfully, userId:', userId);
        
        if (!userId) {
          console.log('❌ No userId in JWT payload');
          return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 });
        }
    } catch (error: any) {
      return NextResponse.json({ 
        message: error instanceof jwt.JsonWebTokenError ? 'Invalid or expired token' : 'Token verification failed' 
      }, { status: 401 });
    }

    // Parse request body
    const { newEmail, currentPassword } = await request.json();
    console.log('📝 Request body received:', { newEmail, hasCurrentPassword: !!currentPassword });

    if (!newEmail || !currentPassword) {
      return NextResponse.json({ message: 'New email and current password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ message: 'Please enter a valid email address' }, { status: 400 });
    }

    // Get user from database
    let users;
    try {
      users = await sql`
        SELECT id, email, "passwordHash" as "passwordHash", name
        FROM users WHERE id = ${userId}
      `;
    } catch (error: any) {
      return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
    }

    if (users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Check if new email is the same as current email
    if (user.email === newEmail) {
      return NextResponse.json({ message: 'New email must be different from current email' }, { status: 400 });
    }

    // Check if new email already exists
    try {
      const existingUsers = await sql`
        SELECT id FROM users WHERE email = ${newEmail}
      `;
      
      if (existingUsers.length > 0) {
        return NextResponse.json({ message: 'This email address is already in use' }, { status: 400 });
      }
    } catch (error: any) {
      return NextResponse.json({ message: 'Failed to check email availability' }, { status: 500 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Check if user is a demo account
    const isDemoAccount = user.email.includes('farmerindi') || 
                         user.email.includes('farmerbiz') ||
                         user.email.includes('traderindi') ||
                         user.email.includes('traderbiz') ||
                         user.email.includes('buyerindi') ||
                         user.email.includes('buyerbiz');

    if (isDemoAccount) {
      return NextResponse.json({ 
        message: 'Demo accounts cannot change email addresses',
        isDemoAccount: true 
      }, { status: 400 });
    }

    // Generate email change verification token
    const emailChangeToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    

    // Save email change token and new email to database
    try {
      console.log('💾 Updating database with email change request...');
      
      // Update emailManagement table for email change request
      // Check if record exists and update only email change fields
      const existingRecord = await sql`
        SELECT id FROM email_management WHERE "userId" = ${userId}
      `;
      
      if (existingRecord.length > 0) {
        // Update existing record with email change token
        await sql`
          UPDATE email_management 
          SET 
            "pendingEmail" = ${newEmail},
            "emailVerificationToken" = ${emailChangeToken},
            "emailVerificationExpires" = ${expiresAt.toISOString()},
            "updatedAt" = NOW()
          WHERE "userId" = ${userId}
        `;
      } else {
        // Insert new record
        await sql`
          INSERT INTO email_management (id, "userId", "pendingEmail", "emailVerificationToken", "emailVerificationExpires", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${userId}, ${newEmail}, ${emailChangeToken}, ${expiresAt.toISOString()}, NOW(), NOW())
        `;
      }
      
      console.log('✅ Database updated successfully for user:', userId);
    } catch (error: any) {
      console.error('❌ Database update error:', error);
      return NextResponse.json({ 
        message: 'Failed to save email change request',
        error: error instanceof Error ? error.message : 'Unknown database error'
      }, { status: 500 });
    }

    // Create verification link - use environment variable for URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }
    const verificationLink = `${baseUrl}/verify-email-change?token=${emailChangeToken}`;
    
    console.log('🔗 Using base URL:', baseUrl);

    // Check if Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        message: 'Email change verification sent (email sending disabled)',
        verificationUrl: verificationLink
      }, { status: 200 });
    }
    

    // Send verification email to new email address
    console.log('📧 Sending email change verification email to:', newEmail);
    console.log('🔗 EMAIL CHANGE VERIFICATION URL FOR TESTING:', verificationLink);
    
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'AgriLink <noreply@hthheh.com>',
        to: [newEmail],
        subject: 'Confirm your new email address - AgriLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Email Change Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to change your email address on AgriLink from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
            <p>To confirm this change, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Confirm Email Change
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p><strong>If you didn't request this change, please ignore this email and your account will remain secure.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The AgriLink Team
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Resend email error:', error);
        // Still return success since we have the verification URL for testing
        return NextResponse.json({ 
          message: 'Email change request saved. Check terminal for verification URL.',
          verificationUrl: verificationLink,
          emailError: error
        }, { status: 200 });
      }

      return NextResponse.json({ 
        message: 'Verification email sent to your new email address',
        emailId: data?.id,
        newEmail: newEmail
      }, { status: 200 });

    } catch (error: any) {
      console.error('❌ Email sending catch error:', error);
      return NextResponse.json({ 
        message: 'Failed to send verification email',
        error: error instanceof Error ? error.message : 'Unknown email error'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Update email API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
