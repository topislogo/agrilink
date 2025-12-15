import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { 
  users, 
  userProfiles, 
  userVerification, 
  userRatings, 
  businessDetails,
  locations
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      name, 
      userType, 
      accountType, 
      location,
      region,
      phone 
    } = await request.json();

    if (!email || !password || !name || !userType || !accountType || !location || !region) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomUUID();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Validate userType and accountType values
    const validUserTypes = ['farmer', 'trader', 'buyer', 'admin'];
    const validAccountTypes = ['individual', 'business'];
    
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be one of: farmer, trader, buyer, admin' },
        { status: 400 }
      );
    }
    
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type. Must be one of: individual, business' },
        { status: 400 }
      );
    }

    // Find or create location
    let locationId = null;
    console.log('📍 Registration - Location (city) received:', location);
    console.log('📍 Registration - Region received:', region);
    
    if (location && region) {
      console.log('📍 Registration - Looking up location in database...');
      
      // Try exact match with city and region
      let locationResult = await db
        .select({ id: locations.id, city: locations.city, region: locations.region })
        .from(locations)
        .where(and(
          sql`LOWER(${locations.city}) = LOWER(${location})`,
          sql`LOWER(${locations.region}) = LOWER(${region})`
        ))
        .limit(1);

      console.log('📍 Registration - Exact match result:', locationResult);
      
      // If no exact match, try just city match (in case region doesn't match exactly)
      if (locationResult.length === 0) {
        console.log('📍 Registration - Trying city-only match...');
        locationResult = await db
          .select({ id: locations.id, city: locations.city, region: locations.region })
          .from(locations)
          .where(sql`LOWER(${locations.city}) = LOWER(${location})`)
          .limit(1);
        console.log('📍 Registration - City-only match result:', locationResult);
      }

      if (locationResult.length > 0) {
        locationId = locationResult[0].id;
        console.log('📍 Registration - Location ID found:', locationId, 'for city:', locationResult[0].city, 'region:', locationResult[0].region);
      } else {
        console.log('📍 Registration - Location not found, creating new location for city:', location, 'region:', region);
        
        // Create new location if it doesn't exist
        const newLocation = await db.insert(locations).values({
          city: location,
          region: region,
        }).returning({ id: locations.id });
        
        locationId = newLocation[0].id;
        console.log('📍 Registration - New location created with ID:', locationId);
      }
    } else {
      console.log('📍 Registration - No location or region provided');
    }


    // Create user in database using Drizzle (simplified structure)
    const newUser = await db.insert(users).values({
      email: normalizedEmail,
      name,
      passwordHash,
      userType,
      accountType,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires: verificationExpires,
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    });

    // Create user profile
    console.log('📍 Registration - Creating user profile with locationId:', locationId);
    await db.insert(userProfiles).values({
      userId: newUser[0].id,
      locationId,
      phone: phone || null,
    });

    // Create verification record
    await db.insert(userVerification).values({
      userId: newUser[0].id,
      verified: false,
      phoneVerified: false,
      verificationStatus: 'not_started',
      verificationSubmitted: false,
      businessDetailsCompleted: false,
    });

    // Create ratings record
    await db.insert(userRatings).values({
      userId: newUser[0].id,
      rating: '0',
      totalReviews: 0,
    });

    // Email verification will be handled separately if needed

    // Create business details if business account
    if (accountType === 'business') {
      await db.insert(businessDetails).values({
        userId: newUser[0].id,
      });
    }

    // Send verification email - use environment variable for URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
    
    console.log('🔗 Using base URL:', baseUrl);
    
    console.log('📧 Sending verification email to:', newUser[0].email);
    console.log('🔗 VERIFICATION URL FOR TESTING:', verificationUrl);
    
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('📧 Attempting to send verification email...');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailResult = await resend.emails.send({
          from: 'AgriLink <noreply@hthheh.com>',
          to: [newUser[0].email],
          subject: 'Verify Your AgriLink Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Welcome to AgriLink!</h2>
              <p>Hello ${newUser[0].name},</p>
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
        
        console.log('✅ Verification email sent successfully!');
        console.log('📧 Resend API response:', emailResult);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        console.error('❌ Email error details:', JSON.stringify(emailError, null, 2));
        // Don't fail registration if email sending fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping verification email');
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: newUser[0].id, 
        email: newUser[0].email,
        userType: userType,
        accountType: accountType
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data
    const userData = {
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
      userType: userType,
      accountType: accountType,
      emailVerified: false,
      location,
      phone: phone || '',
      verified: false,
      phoneVerified: false,
      verificationStatus: 'not_started',
      rating: 0,
      totalReviews: 0,
    };

    const response = NextResponse.json({
      user: userData,
      token,
      message: 'Registration successful. Please check your email to verify your account.',
      verificationEmailSent: true
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
