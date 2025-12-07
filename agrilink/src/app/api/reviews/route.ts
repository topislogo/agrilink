import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { offerReviews, userRatings, offers as offersTable, products as productsTable, users as usersTable, userProfiles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error: any) {
    return null;
  }
}

// GET /api/reviews - Get reviews for a specific offer or user
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');
    const userId = searchParams.get('userId');

    if (offerId) {
      // Get reviews for a specific offer
      const reviewsResult = await sql`
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r."createdAt",
          r."updatedAt",
          reviewer.id as "reviewerId",
          reviewer.name as "reviewerName",
          reviewer."userType" as "reviewerType",
          reviewer."accountType" as "reviewerAccountType",
          reviewer_profile."profileImage" as "reviewerImage",
          reviewee.id as "revieweeId",
          reviewee.name as "revieweeName",
          reviewee."userType" as "revieweeType",
          reviewee."accountType" as "revieweeAccountType",
          reviewee_profile."profileImage" as "revieweeImage"
        FROM offer_reviews r
        INNER JOIN users reviewer ON r."reviewerId" = reviewer.id
        LEFT JOIN user_profiles reviewer_profile ON reviewer.id = reviewer_profile."userId"
        INNER JOIN users reviewee ON r."revieweeId" = reviewee.id
        LEFT JOIN user_profiles reviewee_profile ON reviewee.id = reviewee_profile."userId"
        WHERE r."offerId" = ${offerId}
        ORDER BY r."createdAt" DESC
      `;
      
      const reviews = reviewsResult;

      return NextResponse.json({
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          reviewer: {
            id: review.reviewerId,
            name: review.reviewerName,
            userType: review.reviewerType,
            accountType: review.reviewerAccountType,
            profileImage: review.reviewerImage
          },
          reviewee: {
            id: review.revieweeId,
            name: review.revieweeName,
            userType: review.revieweeType,
            accountType: review.revieweeAccountType,
            profileImage: review.revieweeImage
          }
        }))
      });
    }

    if (userId) {
      // Get reviews for a specific user (reviews they received)
      const reviewsResult = await sql`
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
        WHERE r."revieweeId" = ${userId}
        ORDER BY r."createdAt" DESC
      `;
      
      const reviews = reviewsResult;

      return NextResponse.json({
        reviews: reviews.map(review => ({
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
        }))
      });
    }

    return NextResponse.json(
      { error: 'Missing offerId or userId parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { offerId, rating, comment } = body;

    // Validate required fields
    if (!offerId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: offerId, rating' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if offer exists and is completed
    const offerResult = await sql`
      SELECT 
        o.id,
        o.status,
        o."buyerId",
        o."sellerId",
        buyer.name as "buyerName",
        seller.name as "sellerName"
      FROM offers o
      INNER JOIN users buyer ON o."buyerId" = buyer.id
      INNER JOIN users seller ON o."sellerId" = seller.id
      WHERE o.id = ${offerId}
    `;
    
    const [offer] = offerResult;

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (offer.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed offers' },
        { status: 400 }
      );
    }

    // Check if user is part of this offer
    const isBuyer = offer.buyerId === user.userId;
    const isSeller = offer.sellerId === user.userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'You can only review offers you are part of' },
        { status: 403 }
      );
    }

    // Determine who is being reviewed (the other party)
    const revieweeId = isBuyer ? offer.sellerId : offer.buyerId;

    // Check if user has already reviewed this offer
    const existingReviewResult = await sql`
      SELECT id FROM offer_reviews 
      WHERE "offerId" = ${offerId} AND "reviewerId" = ${user.userId}
    `;
    
    const [existingReview] = existingReviewResult;

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this offer' },
        { status: 400 }
      );
    }

    // Create the review using Drizzle
    const [newReview] = await db
      .insert(offerReviews)
      .values({
        offerId,
        reviewerId: user.userId,
        revieweeId,
        rating,
        comment: comment || null
      })
      .returning();

    // Update user_ratings table with new average rating and total reviews
    const allReviewsResult = await sql`
      SELECT rating FROM offer_reviews WHERE "revieweeId" = ${revieweeId}
    `;
    
    const allReviewsForUser = allReviewsResult;
    const totalReviews = allReviewsForUser.length;
    const averageRating = totalReviews > 0 
      ? allReviewsForUser.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Upsert user_ratings table using Drizzle
    await db
      .insert(userRatings)
      .values({
        userId: revieweeId,
        rating: averageRating.toFixed(2),
        totalReviews: totalReviews,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userRatings.userId,
        set: {
          rating: averageRating.toFixed(2),
          totalReviews: totalReviews,
          updatedAt: new Date()
        }
      });

    return NextResponse.json({
      review: {
        id: newReview.id,
        offerId: newReview.offerId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
        updatedAt: newReview.updatedAt
      },
      message: 'Review created successfully'
    });

  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
