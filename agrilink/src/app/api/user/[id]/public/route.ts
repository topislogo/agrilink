import { NextRequest, NextResponse } from "next/server";
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: identifier } = await params;
  
  try {

    // Check if identifier is an email or user ID
    const isEmail = identifier.includes('@');
    
    // Get user information with complete profile data from core tables
    // Using storefront_details table for customer-facing information
    let userData;
    try {
      if (isEmail) {
        userData = await sql`
          SELECT 
            u.id, u.name, u.email, u."createdAt" as "joinedDate",
            u."userType", u."accountType",
            l.city as location, l.region, up."profileImage", up."storefrontImage", 
            sd.description as "storefrontDescription",
            sd.delivery as "storefrontDelivery",
            sd."paymentMethods" as "storefrontPaymentMethods",
            sd."returnPolicy" as "storefrontReturnPolicy",
            sd."businessHours" as "storefrontBusinessHours",
            up.phone, up.website as "profileWebsite", up."aboutme",
            us.facebook, us.instagram, us.whatsapp, us.tiktok, us.website as "socialWebsite", us."telegram",
            uv.verified, uv."phoneVerified", uv."verificationStatus", 
            bd."businessName", bd."businessDescription", bd."businessLicenseNumber"
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up."userId"
          LEFT JOIN locations l ON up."locationId" = l.id
          LEFT JOIN user_verification uv ON u.id = uv."userId"
          LEFT JOIN business_details bd ON u.id = bd."userId"
          LEFT JOIN storefront_details sd ON u.id = sd."userId"
          LEFT JOIN user_social us ON u.id = us."userId"
          WHERE u.email = ${identifier}
          LIMIT 1
        `;
      } else {
        userData = await sql`
          SELECT 
            u.id, u.name, u.email, u."userType", u."accountType", u."createdAt" as "joinedDate",
            l.city as location, l.region, up."profileImage", up."storefrontImage", 
            sd.description as "storefrontDescription",
            sd.delivery as "storefrontDelivery",
            sd."paymentMethods" as "storefrontPaymentMethods",
            sd."returnPolicy" as "storefrontReturnPolicy",
            sd."businessHours" as "storefrontBusinessHours",
            up.phone, up.website as "profileWebsite", up."aboutme",
            us.facebook, us.instagram, us.whatsapp, us.tiktok, us.website as "socialWebsite", us."telegram",
            uv.verified, uv."phoneVerified", uv."verificationStatus", 
            bd."businessName", bd."businessDescription", bd."businessLicenseNumber"
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up."userId"
          LEFT JOIN locations l ON up."locationId" = l.id
          LEFT JOIN user_verification uv ON u.id = uv."userId"
          LEFT JOIN business_details bd ON u.id = bd."userId"
          LEFT JOIN storefront_details sd ON u.id = sd."userId"
          LEFT JOIN user_social us ON u.id = us."userId"
          WHERE u.id = ${identifier}
          LIMIT 1
        `;
      }
    } catch (dbError: any) {
      // If storefront_details table doesn't exist yet, query without it
      if (dbError.message && (dbError.message.includes('storefront_details') || dbError.message.includes('storefrontDescription'))) {
        console.log('⚠️ storefront_details table not found, querying without it');
        if (isEmail) {
          userData = await sql`
            SELECT 
              u.id, u.name, u.email, u."createdAt" as "joinedDate",
              u."userType", u."accountType",
              l.city as location, l.region, up."profileImage", up."storefrontImage", 
              NULL as "storefrontDescription",
              NULL as "storefrontDelivery",
              NULL as "storefrontPaymentMethods",
              NULL as "storefrontReturnPolicy",
              NULL as "storefrontBusinessHours",
              up.phone, up.website as "profileWebsite", up."aboutme",
              us.facebook, us.instagram, us.whatsapp, us.tiktok, us.website as "socialWebsite", us."telegram",
              uv.verified, uv."phoneVerified", uv."verificationStatus", 
              bd."businessName", bd."businessDescription", bd."businessLicenseNumber"
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up."userId"
            LEFT JOIN locations l ON up."locationId" = l.id
            LEFT JOIN user_verification uv ON u.id = uv."userId"
            LEFT JOIN business_details bd ON u.id = bd."userId"
            LEFT JOIN user_social us ON u.id = us."userId"
            WHERE u.email = ${identifier}
            LIMIT 1
          `;
        } else {
          userData = await sql`
            SELECT 
              u.id, u.name, u.email, u."userType", u."accountType", u."createdAt" as "joinedDate",
              l.city as location, l.region, up."profileImage", up."storefrontImage", 
              NULL as "storefrontDescription",
              NULL as "storefrontDelivery",
              NULL as "storefrontPaymentMethods",
              NULL as "storefrontReturnPolicy",
              NULL as "storefrontBusinessHours",
              up.phone, up.website as "profileWebsite", up."aboutme",
              us.facebook, us.instagram, us.whatsapp, us.tiktok, us.website as "socialWebsite", us."telegram",
              uv.verified, uv."phoneVerified", uv."verificationStatus", 
              bd."businessName", bd."businessDescription", bd."businessLicenseNumber"
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up."userId"
            LEFT JOIN locations l ON up."locationId" = l.id
            LEFT JOIN user_verification uv ON u.id = uv."userId"
            LEFT JOIN business_details bd ON u.id = bd."userId"
            LEFT JOIN user_social us ON u.id = us."userId"
            WHERE u.id = ${identifier}
            LIMIT 1
          `;
        }
      } else {
        throw dbError;
      }
    }

    if (userData.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const user = userData[0];

    // Get user's products if they're a seller (farmer/trader)
    let products: any[] = [];
    if (user.userType === 'farmer' || user.userType === 'trader') {
      const productData = await sql`
        SELECT 
          p.id, p.name, p.description, p.price,
          p.quantity, p."quantityUnit", p.packaging,
          p."availableStock", p."minimumOrder",
          p."createdAt", p."updatedAt", p."isActive",
          pimg."imageData"
        FROM products p
        LEFT JOIN product_images pimg ON p.id = pimg."productId" AND pimg."isPrimary" = true
        WHERE p."sellerId" = ${user.id}
        AND p."isActive" = true
        ORDER BY p."createdAt" DESC
        LIMIT 20
      `;
      
      products = productData.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        quantityUnit: product.quantityUnit,
        packaging: product.packaging,
        unit: product.quantity && product.quantityUnit ? 
          `${product.quantity}${product.quantityUnit}${product.packaging ? ` ${product.packaging}` : ''}` : 
          null,
        imageUrl: product.imageData,
        availableStock: product.availableStock,
        minimumOrder: product.minimumOrder,
        createdAt: product.createdAt,
        lastUpdated: product.updatedAt
      }));
    }

    // Get user's reviews (reviews they received)
    const reviewsData = await sql`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r."createdAt",
        r."updatedAt",
        r."offerId",
        reviewer.id as "reviewerId",
        reviewer.name as "reviewerName",
        reviewer."userType" as "reviewerType",
        reviewer."accountType" as "reviewerAccountType",
        reviewer_profile."profileImage" as "reviewerImage",
        p.name as "productName"
      FROM offer_reviews r
      INNER JOIN users reviewer ON r."reviewerId" = reviewer.id
      LEFT JOIN user_profiles reviewer_profile ON reviewer.id = reviewer_profile."userId"
      INNER JOIN offers o ON r."offerId" = o.id
      INNER JOIN products p ON o."productId" = p.id
      WHERE r."revieweeId" = ${user.id}
      ORDER BY r."createdAt" DESC
      LIMIT 10
    `;
    
    const reviews = reviewsData.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      offerId: review.offerId,
      productName: review.productName,
      reviewer: {
        id: review.reviewerId,
        name: review.reviewerName,
        userType: review.reviewerType,
        accountType: review.reviewerAccountType,
        profileImage: review.reviewerImage
      }
    }));

    // Transform the data to match the expected format
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      accountType: user.accountType,
      joinedDate: user.joinedDate,
      location: user.location,
      profileImage: user.profileImage,
      storefrontImage: user.storefrontImage,
      description: user.storefrontDescription || user.businessDescription || '', // For backward compatibility with SellerStorefront
      storefrontDescription: user.storefrontDescription, // Customer-facing storefront description
      storefrontDelivery: user.storefrontDelivery,
      storefrontPaymentMethods: user.storefrontPaymentMethods,
      storefrontReturnPolicy: user.storefrontReturnPolicy,
      phone: user.phone,
      website: user.socialWebsite || user.profileWebsite || user.website || null,
      aboutme: user.aboutme,
      facebook: user.facebook || null,
      instagram: user.instagram || null,
      whatsapp: user.whatsapp || null,
      tiktok: user.tiktok || null,
      
      // Business info (for business accounts) - from verification
      businessName: user.businessName,
      businessDescription: user.businessDescription, // Official business description from verification
      businessHours: user.storefrontBusinessHours || null, // From storefront_details (customer-facing)
      specialties: [], // Removed from business_details, kept for backward compatibility
      policies: {
        delivery: user.storefrontDelivery || user.policies?.delivery || '',
        payment: user.storefrontPaymentMethods || user.policies?.payment || '',
        returns: user.storefrontReturnPolicy || user.policies?.returns || ''
      },
      
      // Social media
      social: {
        facebook: user.facebook || null,
        instagram: user.instagram || null,
        telegram: user.telegram || null,
        whatsapp: user.whatsapp || null,
        tiktok: user.tiktok || null
      },
      
      // Verification status (flattened for compatibility with getUserVerificationLevel)
      verified: user.verified || false,
      phoneVerified: user.phoneVerified || false,
      verificationStatus: user.verificationStatus || 'unverified',
      verification: {
        verified: user.verified || false,
        phoneVerified: user.phoneVerified || false,
        verificationStatus: user.verificationStatus || 'unverified'
      },
      
      // Ratings and reviews (calculated from actual reviews)
      ratings: {
        rating: reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
        totalReviews: reviews.length,
        responseTime: null
      },
      
      // Additional data
      products: products,
      reviews: reviews
    };

    return NextResponse.json({
      stats: transformedUser,
      user: transformedUser, // Keep for backward compatibility
      message: "User profile fetched successfully"
    });

  } catch (error: any) {
    console.error('User profile API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      identifier: identifier
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch user profile',
        details: error.message
      },
      { status: 500 }
    );
  }
}
