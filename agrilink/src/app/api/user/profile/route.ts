import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { uploadBase64Image, deleteFile } from '@/lib/file-upload';

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
import { sql as dbSql } from '@/lib/db';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No authorization header or invalid format');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('🔐 Verifying token:', token.substring(0, 20) + '...');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Token verified successfully for user:', decoded.userId);
    return decoded;
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    return null;
  }
}

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile data using raw SQL (consistent with PUT method)
    console.log('🔍 Querying database for "userId":', user.userId);
    console.log('📍 Profile API - Debugging location data for user:', user.userId);
    
    const [userProfile] = await dbSql`
      SELECT 
        u.id, u.email, u.name, u."userType", u."accountType", u."emailVerified", u."pendingEmail", u."createdAt",
        bd."businessName", bd."businessDescription", bd."businessLicenseNumber", bd.specialties,
        l.city, l.region, up.phone, up."profileImage", up."storefrontImage",
        uv.verified, uv."phoneVerified", uv."verificationStatus", uv."verificationDocuments", uv."rejectedDocuments", uv."businessDetailsCompleted",
        uv."verificationSubmitted",
        vr."submittedAt" as "verificationSubmittedAt",
        ur.rating, ur."totalReviews"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      LEFT JOIN locations l ON up."locationId" = l.id
      LEFT JOIN user_verification uv ON u.id = uv."userId"
      LEFT JOIN user_ratings ur ON u.id = ur."userId"
      LEFT JOIN business_details bd ON u.id = bd."userId"
      LEFT JOIN verification_requests vr ON u.id = vr."userId" AND vr.status = 'under_review'
      WHERE u.id = ${user.userId}
    `;
    
    console.log('🔍 Database query completed. Result:', !!userProfile);
    if (userProfile) {
      console.log('📍 Profile API - Location data from database:', {
        userId: userProfile.id,
        location: userProfile.location,
        locationType: typeof userProfile.location,
        locationLength: userProfile.location?.length,
        isEmpty: userProfile.location === '',
        isNull: userProfile.location === null
      });
    }
    if (userProfile) {
      console.log('📊 User verification status from DB:', {
        verified: userProfile.verified,
        phoneVerified: userProfile.phoneVerified,
        verificationStatus: userProfile.verificationStatus,
        businessDetailsCompleted: userProfile.businessDetailsCompleted
      });
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('🔍 API /user/profile - Raw database result:', {
      id: userProfile.id,
      location: userProfile.location,
      phone: userProfile.phone,
      name: userProfile.name
    });

    return NextResponse.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        emailVerified: userProfile.emailVerified,
        userType: userProfile.userType,
        accountType: userProfile.accountType,
        location: userProfile.city && userProfile.region 
          ? `${userProfile.city}, ${userProfile.region}` 
          : userProfile.city || userProfile.region || '',
        region: userProfile.region,
        city: userProfile.city,
        phone: userProfile.phone,
        profileImage: userProfile.profileImage,
        storefrontImage: userProfile.storefrontImage,
        verified: userProfile.verified,
        phoneVerified: userProfile.phoneVerified,
        businessName: userProfile.businessName,
        businessDescription: userProfile.businessDescription,
        businessLicenseNumber: userProfile.businessLicenseNumber,
        verificationDocuments: userProfile.verificationDocuments,
        rejectedDocuments: userProfile.rejectedDocuments,
        verificationStatus: userProfile.verificationStatus,
        businessDetailsCompleted: userProfile.businessDetailsCompleted,
        agriLinkVerificationRequested: userProfile.verificationSubmitted || false,
        agriLinkVerificationRequestedAt: userProfile.verificationSubmittedAt,
        verificationSubmitted: userProfile.verificationSubmitted || false,
        verificationSubmittedAt: userProfile.verificationSubmittedAt,
        rating: parseFloat(userProfile.rating?.toString() || '0'),
        totalReviews: userProfile.totalReviews || 0,
        joinedDate: userProfile.createdAt,
        pendingEmail: userProfile.pendingEmail,
        specialties: userProfile.specialties
      }
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log('🔐 PUT /api/user/profile - Verifying token...');
    const user = verifyToken(request);
    if (!user) {
      console.log('❌ Authentication failed - no valid token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ Authentication successful for user:', user.userId);

    const body = await request.json();
    
    const { 
      profileImage, 
      storefrontImage,
      location, 
      phone, 
      phoneVerified,
      business_name,
      business_description,
      business_license_number,
      business_details_completed,
      verificationDocuments,
      agriLinkVerificationRequested,
      agriLinkVerificationRequestedAt,
      verificationStatus,
      verificationSubmittedAt,
      specialties
    } = body;
    
    console.log('📥 Request body received:', {
      business_name,
      business_description,
      business_license_number,
      allKeys: Object.keys(body)
    });

    // Update user profile images
    if (profileImage !== undefined || storefrontImage !== undefined) {
      console.log('🖼️ Updating user profile images:', {
        "userId": user.userId,
        profileImage: profileImage ? 'provided' : 'undefined',
        storefrontImage: storefrontImage ? 'provided' : 'undefined',
        profileImageLength: profileImage?.length || 0,
        storefrontImageLength: storefrontImage?.length || 0,
        bodyKeys: Object.keys(body)
      });
      
      const profileUpdates: any = {};
      
      // Upload profile image to S3 if provided
      if (profileImage !== undefined) {
        try {
          console.log('📤 Uploading profile image to S3...');
          const uploadedFile = await uploadBase64Image(profileImage, 'profiles', `profile-${user.userId}.jpg`);
          profileUpdates.profileImage = uploadedFile.filepath;
          console.log('✅ Profile image uploaded to S3:', uploadedFile.filepath);
        } catch (error) {
          console.error('❌ Profile image upload failed:', error);
          return NextResponse.json(
            { error: 'Failed to upload profile image' },
            { status: 500 }
          );
        }
      }
      
      // Upload storefront image to S3 if provided
      if (storefrontImage !== undefined) {
        try {
          console.log('📤 Uploading storefront image to S3...');
          const uploadedFile = await uploadBase64Image(storefrontImage, 'storefronts', `storefront-${user.userId}.jpg`);
          profileUpdates.storefrontImage = uploadedFile.filepath;
          console.log('✅ Storefront image uploaded to S3:', uploadedFile.filepath);
        } catch (error) {
          console.error('❌ Storefront image upload failed:', error);
          return NextResponse.json(
            { error: 'Failed to upload storefront image' },
            { status: 500 }
          );
        }
      }

      // Check if user_profiles record exists using Drizzle ORM
      const existingProfile = await db
        .select({ userId: userProfiles.userId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.userId))
        .limit(1);
      
      console.log('🔍 Existing profile check:', existingProfile.length > 0 ? 'found' : 'not found');

      if (existingProfile.length > 0) {
        // Get current profile data to clean up old images
        const currentProfile = await db
          .select({ profileImage: userProfiles.profileImage, storefrontImage: userProfiles.storefrontImage })
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.userId))
          .limit(1);
        
        // Update existing record using Drizzle ORM
        console.log('🔄 Updating existing profile record...');
        
        // Only update the fields that were provided
        const updateData: any = {};
        if (profileUpdates.profileImage !== undefined) {
          updateData.profileImage = profileUpdates.profileImage;
        }
        if (profileUpdates.storefrontImage !== undefined) {
          updateData.storefrontImage = profileUpdates.storefrontImage;
        }
        
        await db
          .update(userProfiles)
          .set(updateData)
          .where(eq(userProfiles.userId, user.userId));
        console.log('✅ Profile images updated successfully');
        
        // Clean up old images from S3
        if (currentProfile.length > 0) {
          const currentData = currentProfile[0];
          
          // Delete old profile image if we're updating it
          if (profileUpdates.profileImage !== undefined && currentData.profileImage) {
            try {
              console.log('🗑️ Deleting old profile image from S3:', currentData.profileImage);
              await deleteFile(currentData.profileImage);
              console.log('✅ Old profile image deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete old profile image:', error);
              // Don't fail the entire operation if cleanup fails
            }
          }
          
          // Delete old storefront image if we're updating it
          if (profileUpdates.storefrontImage !== undefined && currentData.storefrontImage) {
            try {
              console.log('🗑️ Deleting old storefront image from S3:', currentData.storefrontImage);
              await deleteFile(currentData.storefrontImage);
              console.log('✅ Old storefront image deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete old storefront image:', error);
              // Don't fail the entire operation if cleanup fails
            }
          }
        }
      } else {
        // Insert new record using Drizzle ORM
        console.log('🆕 Creating new profile record for user:', user.userId);
        await db
          .insert(userProfiles)
          .values({
            userId: user.userId,
            profileImage: profileUpdates.profileImage || null,
            storefrontImage: profileUpdates.storefrontImage || null,
          });
        console.log('✅ New profile record created');
      }
    }

    // Update location
    if (location !== undefined) {
      // Find locationId from locations table using Drizzle ORM
      const locationResult = await db
        .select({ id: locations.id })
        .from(locations)
        .where(eq(locations.city, location))
        .limit(1);

      let locationId = null;
      if (locationResult.length > 0) {
        locationId = locationResult[0].id;
      }

      // Check if user_profiles record exists using Drizzle ORM
      const existingProfile = await db
        .select({ userId: userProfiles.userId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.userId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Update existing record using Drizzle ORM
        await db
          .update(userProfiles)
          .set({ locationId: locationId })
          .where(eq(userProfiles.userId, user.userId));
      } else {
        // Insert new record using Drizzle ORM
        await db
          .insert(userProfiles)
          .values({
            userId: user.userId,
            locationId: locationId,
          });
      }
    }

    // Update phone
    if (phone !== undefined) {
      // Check if user_profiles record exists
      const existingProfile = await db
        .select({ userId: userProfiles.userId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.userId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Update existing record
        await db.update(userProfiles).set({ phone }).where(eq(userProfiles.userId, user.userId));
      } else {
        // Insert new record
        await db.insert(userProfiles).values({
          userId: user.userId,
          phone
        });
      }
    }

    // Update specialties
    if (specialties !== undefined) {
      console.log('🔧 Updating user specialties:', {
        userId: user.userId,
        specialties: specialties,
        specialtiesLength: Array.isArray(specialties) ? specialties.length : 'not array',
        specialtiesType: typeof specialties
      });

      // Ensure specialties is an array (handle null, undefined, or empty string)
      const specialtiesArray = Array.isArray(specialties) ? specialties : [];
      
      console.log('🔧 Processed specialties array:', {
        original: specialties,
        processed: specialtiesArray,
        length: specialtiesArray.length
      });

      // Check if business_details record exists
      const existingBusiness = await db
        .select({ userId: businessDetails.userId })
        .from(businessDetails)
        .where(eq(businessDetails.userId, user.userId))
        .limit(1);

      if (existingBusiness.length > 0) {
        // Update existing record
        console.log('🔄 Updating existing business details with specialties:', specialtiesArray);
        await db.update(businessDetails).set({ specialties: specialtiesArray }).where(eq(businessDetails.userId, user.userId));
        console.log('✅ Updated specialties for existing business details');
      } else {
        // Insert new record
        console.log('🆕 Creating new business details with specialties:', specialtiesArray);
        await db.insert(businessDetails).values({
          userId: user.userId,
          specialties: specialtiesArray
        });
        console.log('✅ Inserted specialties for new business details');
      }
    }

    // Update phone verification status if phone was verified
    if (phone !== undefined || phoneVerified === true) {
      const existingVerification = await db
        .select({ userId: userVerification.userId })
        .from(userVerification)
        .where(eq(userVerification.userId, user.userId))
        .limit(1);

      if (existingVerification.length > 0) {
        await db.update(userVerification).set({ phoneVerified: true }).where(eq(userVerification.userId, user.userId));
      } else {
        await db.insert(userVerification).values({
          userId: user.userId,
          phoneVerified: true
        });
      }
    }

    // Update business details if provided
    if (business_name !== undefined || business_description !== undefined || business_license_number !== undefined) {
      console.log('🔄 Updating business details for user:', user.userId);
      console.log('📋 Business data:', {
        business_name,
        business_description,
        business_license_number,
        "userId": user.userId
      });
      
      try {
        // Check if business_details record exists
        const existingRecord = await dbSql`
          SELECT "userId" FROM business_details WHERE "userId" = ${user.userId} LIMIT 1
        `;
        
        if (existingRecord.length > 0) {
          // Update existing record
          await dbSql`
            UPDATE business_details 
            SET 
              "businessName" = COALESCE(${business_name}, "businessName"),
              "businessDescription" = COALESCE(${business_description}, "businessDescription"),
              "businessLicenseNumber" = COALESCE(${business_license_number}, "businessLicenseNumber"),
              "updatedAt" = NOW()
            WHERE "userId" = ${user.userId}
          `;
          console.log('✅ Business details updated successfully');
        } else {
          // Insert new record
          await dbSql`
            INSERT INTO business_details ("userId", "businessName", "businessDescription", "businessLicenseNumber", "updatedAt")
            VALUES (${user.userId}, ${business_name}, ${business_description}, ${business_license_number}, NOW())
          `;
          console.log('✅ Business details inserted successfully');
        }
      } catch (dbError: any) {
        console.error('❌ Database error updating business details:', dbError);
        throw dbError;
      }
    }

    // Update verification documents if provided
    if (verificationDocuments !== undefined) {
      console.log('🔄 Updating verification documents for user:', user.userId);
      console.log('📋 Verification documents data:', {
        keys: Object.keys(verificationDocuments),
        documentTypes: Object.keys(verificationDocuments).map(key => ({
          type: key,
          status: verificationDocuments[key]?.status,
          name: verificationDocuments[key]?.name,
          hasData: !!verificationDocuments[key]?.data,
          dataLength: verificationDocuments[key]?.data?.length || 0
        }))
      });
      
      try {
        // Process verification documents and upload to S3
        const processedDocuments: any = {};
        
        for (const [docType, docData] of Object.entries(verificationDocuments)) {
          if (docData && typeof docData === 'object' && docData.data) {
            try {
              console.log(`📤 Uploading ${docType} to S3...`);
              const uploadedFile = await uploadBase64Image(
                docData.data, 
                'verification', 
                `${docType}-${user.userId}-${docData.name || 'document'}`
              );
              
              // Store S3 key instead of base64 data
              processedDocuments[docType] = {
                ...docData,
                data: uploadedFile.filepath, // Store S3 key
                s3Key: uploadedFile.filepath,
                uploadedAt: new Date().toISOString()
              };
              
              console.log(`✅ ${docType} uploaded to S3:`, uploadedFile.filepath);
            } catch (uploadError) {
              console.error(`❌ Failed to upload ${docType}:`, uploadError);
              // Keep original data if upload fails
              processedDocuments[docType] = docData;
            }
          } else {
            // Keep non-data fields as is
            processedDocuments[docType] = docData;
          }
        }

        const existingVerification = await db
          .select({ userId: userVerification.userId })
          .from(userVerification)
          .where(eq(userVerification.userId, user.userId))
          .limit(1);

        if (existingVerification.length > 0) {
          await db.update(userVerification).set({ verificationDocuments: processedDocuments }).where(eq(userVerification.userId, user.userId));
        } else {
          await db.insert(userVerification).values({
            userId: user.userId,
            verificationDocuments: processedDocuments
          });
        }
        console.log('✅ Verification documents updated successfully');
      } catch (dbError: any) {
        console.error('❌ Database error updating verification documents:', dbError);
        throw dbError;
      }
    }

    // Update verification status if provided
    if (verificationStatus !== undefined || agriLinkVerificationRequested !== undefined || business_details_completed !== undefined) {
      console.log('🔄 Updating user verification status...');
      
      const verificationUpdates: any = {};
      if (verificationStatus !== undefined) verificationUpdates.verificationStatus = verificationStatus;
      if (business_details_completed !== undefined) verificationUpdates.businessDetailsCompleted = business_details_completed;

      const existingVerification = await db
        .select({ userId: userVerification.userId })
        .from(userVerification)
        .where(eq(userVerification.userId, user.userId))
        .limit(1);

      if (existingVerification.length > 0) {
        await db.update(userVerification).set(verificationUpdates).where(eq(userVerification.userId, user.userId));
      } else {
        await db.insert(userVerification).values({
          userId: user.userId,
          ...verificationUpdates
        });
      }
      
      console.log('✅ User verification status updated');
    }


    // Get updated user profile using normalized structure
    const [updatedProfile] = await dbSql`
      SELECT 
        u.id, u.email, u.name, u."userType", u."accountType", u."emailVerified", u."pendingEmail", u."createdAt",
        bd."businessName", bd."businessDescription", bd."businessLicenseNumber", bd.specialties,
        l.city, l.region, up.phone, up."profileImage", up."storefrontImage",
        uv.verified, uv."phoneVerified", uv."verificationStatus", uv."verificationDocuments", uv."rejectedDocuments", uv."businessDetailsCompleted",
        ur.rating, ur."totalReviews"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      LEFT JOIN locations l ON up."locationId" = l.id
      LEFT JOIN user_verification uv ON u.id = uv."userId"
      LEFT JOIN user_ratings ur ON u.id = ur."userId"
      LEFT JOIN business_details bd ON u.id = bd."userId"
      WHERE u.id = ${user.userId}
    `;

    // updatedProfile is already destructured from the query above
    
    console.log('🔍 Raw database result:', {
      profileImage: updatedProfile.profileImage ? `${updatedProfile.profileImage.substring(0, 50)}... (${updatedProfile.profileImage.length})` : 'null',
      storefrontImage: updatedProfile.storefrontImage ? `${updatedProfile.storefrontImage.substring(0, 50)}... (${updatedProfile.storefrontImage.length})` : 'null',
      allKeys: Object.keys(updatedProfile)
    });
    
    // Debug: Log business details specifically
    console.log('🏪 Business details from database:', {
      businessName: updatedProfile.businessName,
      businessDescription: updatedProfile.businessDescription,
      businessLicenseNumber: updatedProfile.businessLicenseNumber,
      businessNameType: typeof updatedProfile.businessName,
      businessNameLength: updatedProfile.businessName?.length
    });

    // Return updated user data
    console.log('📤 Returning updated profile:', {
      profileImage: updatedProfile.profileImage ? `${updatedProfile.profileImage.substring(0, 50)}... (${updatedProfile.profileImage.length})` : 'null',
      storefrontImage: updatedProfile.storefrontImage ? `${updatedProfile.storefrontImage.substring(0, 50)}... (${updatedProfile.storefrontImage.length})` : 'null'
    });
    
    // Debug: Log the exact response being sent
    const responseData = {
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        userType: updatedProfile.userType,
        accountType: updatedProfile.accountType,
        location: updatedProfile.city && updatedProfile.region 
          ? `${updatedProfile.city}, ${updatedProfile.region}` 
          : updatedProfile.city || updatedProfile.region || '',
        phone: updatedProfile.phone,
        profileImage: updatedProfile.profileImage,
        storefrontImage: updatedProfile.storefrontImage,
        verified: updatedProfile.verified,
        phoneVerified: updatedProfile.phoneVerified,
        businessName: updatedProfile.businessName,
        businessDescription: updatedProfile.businessDescription,
        businessLicenseNumber: updatedProfile.businessLicenseNumber,
        verificationDocuments: updatedProfile.verificationDocuments,
        verificationStatus: updatedProfile.verificationStatus
      },
      message: 'Profile updated successfully'
    };
    
    console.log('📤 Final response data:', {
      businessName: responseData.user.businessName,
      businessDescription: responseData.user.businessDescription,
      businessLicenseNumber: responseData.user.businessLicenseNumber,
      allUserKeys: Object.keys(responseData.user)
    });
    
    return NextResponse.json({
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        emailVerified: updatedProfile.emailVerified,
        userType: updatedProfile.userType,
        accountType: updatedProfile.accountType,
        location: updatedProfile.city && updatedProfile.region 
          ? `${updatedProfile.city}, ${updatedProfile.region}` 
          : updatedProfile.city || updatedProfile.region || '',
        region: updatedProfile.region,
        city: updatedProfile.city,
        phone: updatedProfile.phone,
        profileImage: updatedProfile.profileImage,
        storefrontImage: updatedProfile.storefrontImage,
        verified: updatedProfile.verified,
        phoneVerified: updatedProfile.phoneVerified,
        businessName: updatedProfile.businessName,
        businessDescription: updatedProfile.businessDescription,
        businessLicenseNumber: updatedProfile.businessLicenseNumber,
        verificationDocuments: updatedProfile.verificationDocuments,
        rejectedDocuments: updatedProfile.rejectedDocuments,
        verificationStatus: updatedProfile.verificationStatus,
        businessDetailsCompleted: updatedProfile.businessDetailsCompleted,
        rating: parseFloat(updatedProfile.rating?.toString() || '0'),
        totalReviews: updatedProfile.totalReviews || 0,
        joinedDate: updatedProfile.createdAt,
        pendingEmail: updatedProfile.pendingEmail,
        specialties: updatedProfile.specialties
      },
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating user profile:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        code: error.code,
        hint: error.hint
      },
      { status: 500 }
    );
  }
}
