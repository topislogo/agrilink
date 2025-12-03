import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { conversations as conversationsTable, messages as messagesTable, products as productsTable, users as usersTable, userProfiles, userVerification, userRatings } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    // For development mode, allow any token
    if (process.env.NODE_ENV === 'development') {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return user;
      } catch (error) {
        // If token verification fails in development, return null to force re-authentication
        return null;
      }
    }
    
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

    // First get basic conversations
    const basicConversations = await db
      .select({
        id: conversationsTable.id,
        productId: conversationsTable.productId,
        buyerId: conversationsTable.buyerId,
        sellerId: conversationsTable.sellerId,
        lastMessage: conversationsTable.lastMessage,
        lastMessageTime: conversationsTable.lastMessageTime,
        unreadCount: conversationsTable.unreadCount,
        isActive: conversationsTable.isActive,
        createdAt: conversationsTable.createdAt,
        updatedAt: conversationsTable.updatedAt,
      })
      .from(conversationsTable)
      .where(or(
        eq(conversationsTable.buyerId, user.userId),
        eq(conversationsTable.sellerId, user.userId)
      ))
      .orderBy(desc(conversationsTable.lastMessageTime));

    // Then enrich each conversation with additional data
    const conversations = await Promise.all(
      basicConversations.map(async (conv) => {
        // Get product data including seller information
        const productData = await db
          .select({
            name: productsTable.name,
            sellerId: productsTable.sellerId,
            availableStock: productsTable.availableStock,
            price: productsTable.price,
            quantityUnit: productsTable.quantityUnit,
          })
          .from(productsTable)
          .where(eq(productsTable.id, conv.productId))
          .limit(1);

        // Get other party user data
        const otherPartyId = conv.buyerId === user.userId ? conv.sellerId : conv.buyerId;
        const otherPartyData = await sql`
          SELECT id, name, email, "userType", "accountType"
          FROM users 
          WHERE id = ${otherPartyId}
          LIMIT 1
        `;

        // Get other party profile data
        const otherPartyProfile = await db
          .select({
            phone: userProfiles.phone,
            profileImage: userProfiles.profileImage,
            locationId: userProfiles.locationId,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, otherPartyId))
          .limit(1);

        // Get other party verification data
        const otherPartyVerification = await db
          .select({
            verified: userVerification.verified,
            phoneVerified: userVerification.phoneVerified,
            verificationSubmitted: userVerification.verificationSubmitted,
          })
          .from(userVerification)
          .where(eq(userVerification.userId, otherPartyId))
          .limit(1);

        // Get other party rating data
        const otherPartyRating = await db
          .select({
            rating: userRatings.rating,
            totalReviews: userRatings.totalReviews,
          })
          .from(userRatings)
          .where(eq(userRatings.userId, otherPartyId))
          .limit(1);

        return {
          ...conv,
          productData: productData[0] || null,
          otherPartyData: otherPartyData[0] || null,
          otherPartyProfile: otherPartyProfile[0] || null,
          otherPartyVerification: otherPartyVerification[0] || null,
          otherPartyRating: otherPartyRating[0] || null,
        };
      })
    );

    // Transform results to match frontend expectations
    const transformedConversations = conversations.map(conv => {
      // Use placeholder image for now
      const productImage = '/api/placeholder/400/300';

      // Determine verification status
      let verificationStatus = 'unverified';
      if (conv.otherPartyVerification?.verified) {
        // Check account type to determine the appropriate verification level
        if (conv.otherPartyData?.accountType === 'business') {
          verificationStatus = 'business-verified';
        } else {
          verificationStatus = 'id-verified';
        }
      } else if (conv.otherPartyVerification?.verificationSubmitted) {
        verificationStatus = 'under-review';
      }

      return {
        id: conv.id,
        productId: conv.productId,
        productName: conv.productData?.name || 'Unknown Product',
        productImage,
        productSellerId: conv.productData?.sellerId,
        productPrice: conv.productData?.price || 0,
        productUnit: conv.productData?.quantityUnit || 'units',
        productAvailableQuantity: conv.productData?.availableStock || '0',
        otherParty: {
          id: conv.otherPartyData?.id || 'unknown',
          name: conv.otherPartyData?.name || 'Unknown User',
          type: conv.otherPartyData?.userType || 'farmer',
          accountType: conv.otherPartyData?.accountType || 'individual',
          location: 'Myanmar', // Will be populated with actual location later
          rating: conv.otherPartyRating?.rating || 0,
          verified: conv.otherPartyVerification?.verified || false,
          phoneVerified: conv.otherPartyVerification?.phoneVerified || false,
          verificationStatus,
          profileImage: conv.otherPartyProfile?.profileImage || ''
        },
        lastMessage: {
          content: conv.lastMessage || 'No messages yet',
          timestamp: conv.lastMessageTime || conv.createdAt,
          isOwn: false
        },
        unreadCount: conv.unreadCount || 0,
        status: conv.isActive ? 'active' as const : 'archived' as const
      };
    });

    return NextResponse.json({
      conversations: transformedConversations,
      message: 'Conversations fetched successfully'
    });

  } catch (error: any) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

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
    const { buyerId, sellerId, productId } = body;

    if (!buyerId || !sellerId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversations = await db
      .select()
      .from(conversationsTable)
      .where(and(
        eq(conversationsTable.buyerId, buyerId),
        eq(conversationsTable.sellerId, sellerId),
        eq(conversationsTable.productId, productId)
      ))
      .limit(1);

    if (existingConversations.length > 0) {
      return NextResponse.json({
        conversation: existingConversations[0],
        message: 'Existing conversation found'
      });
    }

    // Get product and user details using Drizzle
    const productData = await db
      .select({ name: productsTable.name })
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    const buyerData = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, buyerId));

    const sellerData = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, sellerId));

    // Create new conversation using Drizzle
    const [newConversation] = await db
      .insert(conversationsTable)
      .values({
        buyerId,
        sellerId,
        productId,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0
      })
      .returning();

    return NextResponse.json({
      conversation: newConversation,
      message: 'Conversation created successfully'
    });

  } catch (error: any) {
    console.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
