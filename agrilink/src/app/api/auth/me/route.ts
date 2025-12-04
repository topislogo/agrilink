import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { users, userProfiles, userVerification, userRatings, locations } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch (error: any) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from database using Drizzle with simplified structure
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        userType: users.userType,
        accountType: users.accountType,
        phone: userProfiles.phone,
        profileImage: userProfiles.profileImage,
        storefrontImage: userProfiles.storefrontImage,
        location: sql<string>`CASE WHEN ${locations.city} IS NOT NULL AND ${locations.region} IS NOT NULL THEN ${locations.city} || ', ' || ${locations.region} ELSE ${locations.city} END`,
        region: locations.region,
        city: locations.city,
        verified: userVerification.verified,
        phoneVerified: userVerification.phoneVerified,
        verificationStatus: userVerification.verificationStatus,
        verificationDocuments: userVerification.verificationDocuments,
        rating: userRatings.rating,
        totalReviews: userRatings.totalReviews,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(locations, eq(userProfiles.locationId, locations.id))
      .leftJoin(userVerification, eq(users.id, userVerification.userId))
      .leftJoin(userRatings, eq(users.id, userRatings.userId))
      .where(eq(users.id, user.userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profile = userResult[0];
    const userObj = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      userType: profile.userType,
      accountType: profile.accountType,
      emailVerified: profile.emailVerified,
      location: profile.location,
      region: profile.region,
      city: profile.city,
      phone: profile.phone,
      verified: profile.verified,
      phoneVerified: profile.phoneVerified,
      businessVerified: profile.verified && profile.accountType === 'business',
      profileImage: profile.profileImage || '',
      storefrontImage: profile.storefrontImage || '',
      joinedDate: profile.createdAt,
      verificationStatus: profile.verificationStatus || 'not_started',
      verificationDocuments: profile.verificationDocuments || {},
      rating: parseFloat(profile.rating?.toString() || '0'),
      totalReviews: profile.totalReviews || 0,
    };

    return NextResponse.json({
      user: userObj,
      message: 'User data fetched successfully'
    });

  } catch (error: any) {
    console.error('Auth me API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
