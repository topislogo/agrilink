import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

/**
 * Helper functions for working with the normalized database schema
 * These functions provide easy-to-use interfaces for common operations
 */

const sql = neon(process.env.DATABASE_URL!);

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get complete user data with all related information
 */
export async function getUserWithAllData(email: string) {
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType, u.emailVerified,
      u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt,
      
      -- Verification data
      uv.verificationStatus, uv.verificationDocuments, uv.rejectedDocuments,
      uv.verificationSubmittedAt, uv.agriLinkVerificationRequested, uv.agriLinkVerificationRequestedAt,
      
      -- Business data
      bd.businessName, bd.businessDescription, bd.businessLicenseNumber,
      
      -- Email management data
      em.pendingEmail, em.emailVerificationToken, em.emailVerificationExpires,
      em.passwordResetToken, em.passwordResetExpires,
      
      -- Profile data
      up.location, up.phone, up.experience, up.profileImage, up.storefrontImage, up.website,
      
      -- Social data
      us.facebook, us.instagram, us.telegram,
      
      -- Rating data
      ur.rating, ur.totalReviews
      
    FROM users_new u
    LEFT JOIN user_verification_new uv ON u.id = uv.userId
    LEFT JOIN business_details_new bd ON u.id = bd.userId
    LEFT JOIN email_management_new em ON u.id = em.userId
    LEFT JOIN user_profiles up ON u.id = up.userId
    LEFT JOIN user_social us ON u.id = us.userId
    LEFT JOIN user_ratings ur ON u.id = ur.userId
    WHERE u.email = ${email}
  `;
  
  return result[0] || null;
}

/**
 * Get user by ID with all related information
 */
export async function getUserByIdWithAllData(userId: string) {
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType, u.emailVerified,
      u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt,
      
      -- Verification data
      uv.verificationStatus, uv.verificationDocuments, uv.rejectedDocuments,
      uv.verificationSubmittedAt, uv.agriLinkVerificationRequested, uv.agriLinkVerificationRequestedAt,
      
      -- Business data
      bd.businessName, bd.businessDescription, bd.businessLicenseNumber,
      
      -- Email management data
      em.pendingEmail, em.emailVerificationToken, em.emailVerificationExpires,
      em.passwordResetToken, em.passwordResetExpires,
      
      -- Profile data
      up.location, up.phone, up.experience, up.profileImage, up.storefrontImage, up.website,
      
      -- Social data
      us.facebook, us.instagram, us.telegram,
      
      -- Rating data
      ur.rating, ur.totalReviews
      
    FROM users_new u
    LEFT JOIN user_verification_new uv ON u.id = uv.userId
    LEFT JOIN business_details_new bd ON u.id = bd.userId
    LEFT JOIN email_management_new em ON u.id = em.userId
    LEFT JOIN user_profiles up ON u.id = up.userId
    LEFT JOIN user_social us ON u.id = us.userId
    LEFT JOIN user_ratings ur ON u.id = ur.userId
    WHERE u.id = ${userId}
  `;
  
  return result[0] || null;
}

/**
 * Get users by type with basic information
 */
export async function getUsersByType(userType: string, limit: number = 50) {
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType, u.emailVerified,
      up.location, up.phone, up.profileImage,
      ur.rating, ur.totalReviews
    FROM users_new u
    LEFT JOIN user_profiles up ON u.id = up.userId
    LEFT JOIN user_ratings ur ON u.id = ur.userId
    WHERE u.userType = ${userType}
    ORDER BY u.createdAt DESC
    LIMIT ${limit}
  `;
  
  return result;
}

/**
 * Get business users with business details
 */
export async function getBusinessUsers(limit: number = 50) {
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType,
      bd.businessName, bd.businessDescription, bd.businessLicenseNumber,
      up.location, up.phone, up.profileImage,
      ur.rating, ur.totalReviews
    FROM users_new u
    INNER JOIN business_details_new bd ON u.id = bd.userId
    LEFT JOIN user_profiles up ON u.id = up.userId
    LEFT JOIN user_ratings ur ON u.id = ur.userId
    ORDER BY u.createdAt DESC
    LIMIT ${limit}
  `;
  
  return result;
}

// ============================================================================
// USER CREATION
// ============================================================================

/**
 * Create a complete user with all related data
 */
export async function createCompleteUser(userData: {
  email: string;
  name: string;
  passwordHash: string;
  userType: string;
  accountType: string;
  emailVerified?: boolean;
  
  // Optional business data
  businessName?: string;
  businessDescription?: string;
  businessLicenseNumber?: string;
  
  // Optional verification data
  verificationStatus?: string;
  verificationDocuments?: any;
  
  // Optional profile data
  location?: string;
  phone?: string;
  experience?: string;
  profileImage?: string;
  
  // Optional social data
  facebook?: string;
  instagram?: string;
  telegram?: string;
}) {
  // Create core user
  const user = await sql`
    INSERT INTO users_new (email, name, passwordHash, userType, accountType, emailVerified)
    VALUES (
      ${userData.email}, 
      ${userData.name}, 
      ${userData.passwordHash}, 
      ${userData.userType}, 
      ${userData.accountType},
      ${userData.emailVerified || false}
    )
    RETURNING id, email, name, userType, accountType
  `;
  
  const userId = user[0].id;
  
  // Add business details if provided
  if (userData.businessName || userData.businessDescription || userData.businessLicenseNumber) {
    await sql`
      INSERT INTO business_details_new (userId, businessName, businessDescription, businessLicenseNumber)
      VALUES (
        ${userId}, 
        ${userData.businessName || null}, 
        ${userData.businessDescription || null}, 
        ${userData.businessLicenseNumber || null}
      )
    `;
  }
  
  // Add verification data if provided
  if (userData.verificationStatus || userData.verificationDocuments) {
    await sql`
      INSERT INTO user_verification_new (userId, verificationStatus, verificationDocuments)
      VALUES (
        ${userId}, 
        ${userData.verificationStatus || null}, 
        ${userData.verificationDocuments ? JSON.stringify(userData.verificationDocuments) : null}
      )
    `;
  }
  
  // Add profile data if provided
  if (userData.location || userData.phone || userData.experience || userData.profileImage) {
    await sql`
      INSERT INTO user_profiles (userId, location, phone, experience, profileImage)
      VALUES (
        ${userId}, 
        ${userData.location || null}, 
        ${userData.phone || null}, 
        ${userData.experience || null}, 
        ${userData.profileImage || null}
      )
    `;
  }
  
  // Add social data if provided
  if (userData.facebook || userData.instagram || userData.telegram) {
    await sql`
      INSERT INTO user_social (userId, facebook, instagram, telegram)
      VALUES (
        ${userId}, 
        ${userData.facebook || null}, 
        ${userData.instagram || null}, 
        ${userData.telegram || null}
      )
    `;
  }
  
  // Initialize rating data
  await sql`
    INSERT INTO user_ratings (userId, rating, totalReviews)
    VALUES (${userId}, 0, 0)
  `;
  
  return user[0];
}

// ============================================================================
// USER UPDATES
// ============================================================================

/**
 * Update user verification status
 */
export async function updateUserVerification(userId: string, verificationData: {
  verificationStatus?: string;
  verificationDocuments?: any;
  rejectedDocuments?: any;
  verificationSubmittedAt?: Date;
}) {
  await sql`
    INSERT INTO user_verification_new (userId, verificationStatus, verificationDocuments, rejectedDocuments, verificationSubmittedAt)
    VALUES (
      ${userId}, 
      ${verificationData.verificationStatus || null},
      ${verificationData.verificationDocuments ? JSON.stringify(verificationData.verificationDocuments) : null},
      ${verificationData.rejectedDocuments ? JSON.stringify(verificationData.rejectedDocuments) : null},
      ${verificationData.verificationSubmittedAt || null}
    )
    ON CONFLICT (userId) 
    DO UPDATE SET
      verificationStatus = EXCLUDED.verificationStatus,
      verificationDocuments = EXCLUDED.verificationDocuments,
      rejectedDocuments = EXCLUDED.rejectedDocuments,
      verificationSubmittedAt = EXCLUDED.verificationSubmittedAt,
      updatedAt = NOW()
  `;
}

/**
 * Update business details
 */
export async function updateBusinessDetails(userId: string, businessData: {
  businessName?: string;
  businessDescription?: string;
  businessLicenseNumber?: string;
}) {
  await sql`
    INSERT INTO business_details_new (userId, businessName, businessDescription, businessLicenseNumber)
    VALUES (
      ${userId}, 
      ${businessData.businessName || null}, 
      ${businessData.businessDescription || null}, 
      ${businessData.businessLicenseNumber || null}
    )
    ON CONFLICT (userId) 
    DO UPDATE SET
      businessName = EXCLUDED.businessName,
      businessDescription = EXCLUDED.businessDescription,
      businessLicenseNumber = EXCLUDED.businessLicenseNumber,
      updatedAt = NOW()
  `;
}

/**
 * Update email management data
 */
export async function updateEmailManagement(userId: string, emailData: {
  pendingEmail?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}) {
  await sql`
    INSERT INTO email_management_new (
      userId, pendingEmail, emailVerificationToken, emailVerificationExpires,
      passwordResetToken, passwordResetExpires
    )
    VALUES (
      ${userId}, 
      ${emailData.pendingEmail || null},
      ${emailData.emailVerificationToken || null},
      ${emailData.emailVerificationExpires || null},
      ${emailData.passwordResetToken || null},
      ${emailData.passwordResetExpires || null}
    )
    ON CONFLICT (userId) 
    DO UPDATE SET
      pendingEmail = EXCLUDED.pendingEmail,
      emailVerificationToken = EXCLUDED.emailVerificationToken,
      emailVerificationExpires = EXCLUDED.emailVerificationExpires,
      passwordResetToken = EXCLUDED.passwordResetToken,
      passwordResetExpires = EXCLUDED.passwordResetExpires,
      updatedAt = NOW()
  `;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get users with pending email verification
 */
export async function getUsersWithPendingEmails() {
  const result = await sql`
    SELECT u.email, u.name, em.pendingEmail, em.emailVerificationToken, em.emailVerificationExpires
    FROM users_new u
    INNER JOIN email_management_new em ON u.id = em.userId
    WHERE em.pendingEmail IS NOT NULL 
    AND em.emailVerificationExpires > NOW()
  `;
  
  return result;
}

/**
 * Get users with password reset requests
 */
export async function getUsersWithPasswordResetRequests() {
  const result = await sql`
    SELECT u.email, u.name, em.passwordResetToken, em.passwordResetExpires
    FROM users_new u
    INNER JOIN email_management_new em ON u.id = em.userId
    WHERE em.passwordResetToken IS NOT NULL 
    AND em.passwordResetExpires > NOW()
  `;
  
  return result;
}

/**
 * Get users awaiting verification
 */
export async function getUsersAwaitingVerification() {
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType,
      uv.verificationStatus, uv.verificationSubmittedAt,
      bd.businessName
    FROM users_new u
    INNER JOIN user_verification_new uv ON u.id = uv.userId
    LEFT JOIN business_details_new bd ON u.id = bd.userId
    WHERE uv.verificationStatus IN ('pending', 'submitted')
    ORDER BY uv.verificationSubmittedAt ASC
  `;
  
  return result;
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string, limit: number = 20) {
  const searchTerm = `%${query}%`;
  
  const result = await sql`
    SELECT 
      u.id, u.email, u.name, u.userType, u.accountType,
      up.location, up.profileImage,
      ur.rating, ur.totalReviews
    FROM users_new u
    LEFT JOIN user_profiles up ON u.id = up.userId
    LEFT JOIN user_ratings ur ON u.id = ur.userId
    WHERE u.name ILIKE ${searchTerm} 
    OR u.email ILIKE ${searchTerm}
    ORDER BY u.name ASC
    LIMIT ${limit}
  `;
  
  return result;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get user statistics
 */
export async function getUserStatistics() {
  const result = await sql`
    SELECT 
      COUNT(*) as totalUsers,
      COUNT(CASE WHEN userType = 'farmer' THEN 1 END) as farmers,
      COUNT(CASE WHEN userType = 'trader' THEN 1 END) as traders,
      COUNT(CASE WHEN userType = 'buyer' THEN 1 END) as buyers,
      COUNT(CASE WHEN userType = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN accountType = 'business' THEN 1 END) as businessUsers,
      COUNT(CASE WHEN emailVerified = true THEN 1 END) as verifiedUsers,
      COUNT(CASE WHEN uv.verificationStatus = 'verified' THEN 1 END) as agriLinkVerified
    FROM users_new u
    LEFT JOIN user_verification_new uv ON u.id = uv.userId
  `;
  
  return result[0];
}
