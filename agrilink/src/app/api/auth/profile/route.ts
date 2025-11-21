import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { 
  users, 
  userProfiles, 
  userVerification, 
  userRatings, 
  businessDetails,
  locations
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Profile update API called');
    
    const user = verifyToken(request);
    
    if (!user) {
      console.log('❌ Unauthorized - no valid token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates = body;
    
    console.log('📝 Profile update data:', {
      userId: user.userId,
      updates: {
        hasProfileImage: !!updates.profileImage,
        hasStorefrontImage: !!updates.storefrontImage,
        hasLocation: !!updates.location,
        hasPhone: !!updates.phone,
        otherFields: Object.keys(updates).filter(key => !['profileImage', 'storefrontImage', 'location', 'phone'].includes(key))
      }
    });

    // Update main users table fields
    const userUpdates: any = {};
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.email !== undefined) userUpdates.email = updates.email;

    // Handle userType and accountType updates (need to find IDs from lookup tables)
    if (updates.userType !== undefined || updates.accountType !== undefined) {
      if (updates.userType !== undefined) {
        // Validate userType value
        const validUserTypes = ['farmer', 'trader', 'buyer', 'admin'];
        if (validUserTypes.includes(updates.userType)) {
          userUpdates.userType = updates.userType;
        }
      }

      if (updates.accountType !== undefined) {
        // Validate accountType value
        const validAccountTypes = ['individual', 'business'];
        if (validAccountTypes.includes(updates.accountType)) {
          userUpdates.accountType = updates.accountType;
        }
      }
    }

    // Update users table if there are updates
    if (Object.keys(userUpdates).length > 0) {
      console.log('💾 Updating users table with:', userUpdates);
      await db.update(users).set(userUpdates).where(eq(users.id, user.userId));
      console.log('✅ users table updated successfully');
    }

    // Update user_profiles table if profile-specific fields are provided
    if (updates.profileImage !== undefined || updates.storefrontImage !== undefined || updates.location !== undefined || updates.phone !== undefined) {
      const profileUpdates: any = {};
      
      if (updates.profileImage !== undefined) profileUpdates.profileImage = updates.profileImage;
      if (updates.storefrontImage !== undefined) profileUpdates.storefrontImage = updates.storefrontImage;
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

      // Handle location update - find locationId from locations table
      if (updates.location !== undefined) {
        const locationResult = await db
          .select({ id: locations.id })
          .from(locations)
          .where(eq(locations.city, updates.location))
          .limit(1);

        if (locationResult.length > 0) {
          profileUpdates.locationId = locationResult[0].id;
        }
      }

      console.log('💾 Updating user_profiles table with:', profileUpdates);
      
      // Check if user profile exists
      const existingProfile = await db
        .select({ userId: userProfiles.userId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.userId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Update existing profile
        await db.update(userProfiles).set(profileUpdates).where(eq(userProfiles.userId, user.userId));
      } else {
        // Insert new profile
        await db.insert(userProfiles).values({
          userId: user.userId,
          ...profileUpdates
        });
      }
      
      console.log('✅ user_profiles updated successfully');
    }

    // Update user_verification table if verification fields are provided
    if (updates.verificationStatus !== undefined || updates.verificationDocuments !== undefined || updates.verified !== undefined || updates.phoneVerified !== undefined) {
      const verificationUpdates: any = {};
      
      if (updates.verificationStatus !== undefined) verificationUpdates.verificationStatus = updates.verificationStatus;
      if (updates.verificationDocuments !== undefined) verificationUpdates.verificationDocuments = updates.verificationDocuments;
      if (updates.verified !== undefined) verificationUpdates.verified = updates.verified;
      if (updates.phoneVerified !== undefined) verificationUpdates.phoneVerified = updates.phoneVerified;

      console.log('💾 Updating user_verification table with:', verificationUpdates);
      
      // Check if user verification record exists
      const existingVerification = await db
        .select({ userId: userVerification.userId })
        .from(userVerification)
        .where(eq(userVerification.userId, user.userId))
        .limit(1);

      if (existingVerification.length > 0) {
        // Update existing verification record
        await db.update(userVerification).set(verificationUpdates).where(eq(userVerification.userId, user.userId));
      } else {
        // Insert new verification record
        await db.insert(userVerification).values({
          userId: user.userId,
          ...verificationUpdates
        });
      }
      
      console.log('✅ user_verification updated successfully');
    }

    console.log('✅ Profile update completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
