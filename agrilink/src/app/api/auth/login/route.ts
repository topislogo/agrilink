import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, userProfiles, userVerification, userRatings, locations } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called - POST request received');
    console.log('🔐 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('🔐 Request body received:', { email: body.email, hasPassword: !!body.password });
    
    const { email, password } = body;
    console.log('📧 Login email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database with all related data using Drizzle (simplified structure)
    console.log('🔍 Querying database for user:', email);
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
        userType: users.userType,
        accountType: users.accountType,
        isRestricted: users.isRestricted,
        phone: userProfiles.phone,
        profileImage: userProfiles.profileImage,
        location: sql<string>`CASE WHEN ${locations.city} IS NOT NULL AND ${locations.region} IS NOT NULL THEN ${locations.city} || ', ' || ${locations.region} ELSE ${locations.city} END`,
        region: locations.region,
        city: locations.city,
        verified: userVerification.verified,
        phoneVerified: userVerification.phoneVerified,
        verificationStatus: userVerification.verificationStatus,
        rating: userRatings.rating,
        totalReviews: userRatings.totalReviews,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(locations, eq(userProfiles.locationId, locations.id))
      .leftJoin(userVerification, eq(users.id, userVerification.userId))
      .leftJoin(userRatings, eq(users.id, userRatings.userId))
      .where(eq(users.email, email))
      .limit(1);

    console.log('👤 User query result:', userResult.length > 0 ? 'User found' : 'No user found');
    
    if (userResult.length === 0) {
      console.log('❌ No user found for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Debug JWT_SECRET
    console.log('🔐 JWT_SECRET check:');
    console.log('  JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('  JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('  JWT_SECRET starts with:', process.env.JWT_SECRET?.substring(0, 10) || 'undefined');
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.userType,
        accountType: user.accountType
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      accountType: user.accountType,
      isRestricted: user.isRestricted,
      emailVerified: user.emailVerified,
      location: user.location,
      region: user.region,
      city: user.city,
      phone: user.phone,
      profileImage: user.profileImage,
      verified: user.verified,
      phoneVerified: user.phoneVerified,
      verificationStatus: user.verificationStatus,
      rating: parseFloat(user.rating?.toString() || '0'),
      totalReviews: user.totalReviews || 0,
    };

    const response = NextResponse.json({
      user: userData,
      token,
      message: 'Login successful'
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
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
