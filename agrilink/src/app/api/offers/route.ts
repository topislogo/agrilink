import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offerNotificationService } from '@/services/offerNotificationService';
import jwt from 'jsonwebtoken';


import { 
  offers as offersTable,
  products as productsTable,
  productImages,
  users as usersTable,
  userProfiles,
  
  
  categories,
  conversations
} from '@/lib/db/schema';
import { eq, and, or, desc, inArray } from 'drizzle-orm';
import { verifyToken as verifyTokenApi } from '@/lib/api-middleware';
import { sql } from '@/lib/db';

function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    // For development mode, try to verify the token, but allow any valid token
    if (process.env.NODE_ENV === 'development') {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return user;
      } catch (error) {
        // If token verification fails in development, return null to force re-authentication
        return null;
      }
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return user;
  } catch (error: any) {
    return null;
  }
}

// GET /api/offers - Fetch offers
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
    console.log('🔍 Offers API - GET request received for user:', user.userId);
    
    const type = searchParams.get('type'); // 'sent' or 'received'
    const status = searchParams.get('status'); // filter by status
    const conversationId = searchParams.get('conversationId'); // filter by conversation
    
    console.log('🔍 Offers API - Query params:', { type, status, conversationId });

    // Build the query based on parameters using Drizzle ORM
    let offers;
    
    if (conversationId) {
      // Fetch offers for a specific conversation with detailed product and user info
      console.log('🔍 Fetching offers for conversation:', conversationId);
      const offersResult = await dbSql`
        SELECT 
          o.id,
          o."conversationId",
          o."offerPrice" as "offerPrice",
          o.quantity,
          o.message,
          o.status,
          o."deliveryAddress",
          o."deliveryOptions" as "deliveryOptions",
          o."paymentTerms" as "paymentTerms",
          o."expiresAt" as "expiresAt",
          o."createdAt",
          o."updatedAt",
          o."cancelledBy",
          o."cancellationReason",
          p.id as "productId",
          p.name as "productName",
          c.name as "productCategory",
          pi."imageData" as "productImage",
          buyer.id as "buyerId",
          buyer.name as "buyerName",
          buyer.email as "buyerEmail",
          buyer."userType" as "buyerType",
          buyer."accountType" as "buyerAccountType",
          buyer_profile."profileImage" as "buyerImage",
          seller.id as "sellerId",
          seller.name as "sellerName",
          seller.email as "sellerEmail",
          seller."userType" as "sellerType",
          seller."accountType" as "sellerAccountType",
          seller_profile."profileImage" as "sellerImage"
        FROM offers o
        INNER JOIN products p ON o."productId" = p.id
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN product_images pi ON p.id = pi."productId" AND pi."isPrimary" = true
        INNER JOIN users buyer ON o."buyerId" = buyer.id
        LEFT JOIN user_profiles buyer_profile ON buyer.id = buyer_profile."userId"
        INNER JOIN users seller ON o."sellerId" = seller.id
        LEFT JOIN user_profiles seller_profile ON seller.id = seller_profile."userId"
        WHERE o."conversationId" = ${conversationId}
        ORDER BY o."createdAt" DESC
      `;
      offers = offersResult;
      console.log('✅ Offers query executed, found', offers.length, 'offers');
    } else if (type === 'sent') {
      // Fetch sent offers with detailed product and user info
      const sentOffersResult = await dbSql`
        SELECT 
          o.id,
          o."conversationId",
          o."offerPrice" as "offerPrice",
          o.quantity,
          o.message,
          o.status,
          o."deliveryAddress",
          o."deliveryOptions" as "deliveryOptions",
          o."paymentTerms" as "paymentTerms",
          o."expiresAt" as "expiresAt",
          o."createdAt",
          o."updatedAt",
          o."cancelledBy",
          o."cancellationReason",
          p.id as "productId",
          p.name as "productName",
          c.name as "productCategory",
          pi."imageData" as "productImage",
          buyer.id as "buyerId",
          buyer.name as "buyerName",
          buyer.email as "buyerEmail",
          buyer."userType" as "buyerType",
          buyer."accountType" as "buyerAccountType",
          buyer_profile."profileImage" as "buyerImage",
          seller.id as "sellerId",
          seller.name as "sellerName",
          seller.email as "sellerEmail",
          seller."userType" as "sellerType",
          seller."accountType" as "sellerAccountType",
          seller_profile."profileImage" as "sellerImage"
        FROM offers o
        INNER JOIN products p ON o."productId" = p.id
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN product_images pi ON p.id = pi."productId" AND pi."isPrimary" = true
        INNER JOIN users buyer ON o."buyerId" = buyer.id
        LEFT JOIN user_profiles buyer_profile ON buyer.id = buyer_profile."userId"
        INNER JOIN users seller ON o."sellerId" = seller.id
        LEFT JOIN user_profiles seller_profile ON seller.id = seller_profile."userId"
        WHERE o."buyerId" = ${user.userId}
        ORDER BY o."createdAt" DESC
      `;
      offers = sentOffersResult;
    } else if (type === 'received') {
      // Fetch received offers with detailed product and user info
      const receivedOffersResult = await dbSql`
        SELECT 
          o.id,
          o."conversationId",
          o."offerPrice" as "offerPrice",
          o.quantity,
          o.message,
          o.status,
          o."deliveryAddress",
          o."deliveryOptions" as "deliveryOptions",
          o."paymentTerms" as "paymentTerms",
          o."expiresAt" as "expiresAt",
          o."createdAt",
          o."updatedAt",
          o."cancelledBy",
          o."cancellationReason",
          p.id as "productId",
          p.name as "productName",
          c.name as "productCategory",
          pi."imageData" as "productImage",
          buyer.id as "buyerId",
          buyer.name as "buyerName",
          buyer.email as "buyerEmail",
          buyer."userType" as "buyerType",
          buyer."accountType" as "buyerAccountType",
          buyer_profile."profileImage" as "buyerImage",
          seller.id as "sellerId",
          seller.name as "sellerName",
          seller.email as "sellerEmail",
          seller."userType" as "sellerType",
          seller."accountType" as "sellerAccountType",
          seller_profile."profileImage" as "sellerImage"
        FROM offers o
        INNER JOIN products p ON o."productId" = p.id
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN product_images pi ON p.id = pi."productId" AND pi."isPrimary" = true
        INNER JOIN users buyer ON o."buyerId" = buyer.id
        LEFT JOIN user_profiles buyer_profile ON buyer.id = buyer_profile."userId"
        INNER JOIN users seller ON o."sellerId" = seller.id
        LEFT JOIN user_profiles seller_profile ON seller.id = seller_profile."userId"
        WHERE o."sellerId" = ${user.userId}
        ORDER BY o."createdAt" DESC
      `;
      offers = receivedOffersResult;
    } else {
      // Default: fetch all offers for the user (both sent and received) with detailed info
      const allOffersResult = await dbSql`
        SELECT 
          o.id,
          o."conversationId",
          o."offerPrice" as "offerPrice",
          o.quantity,
          o.message,
          o.status,
          o."deliveryAddress",
          o."deliveryOptions" as "deliveryOptions",
          o."paymentTerms" as "paymentTerms",
          o."expiresAt" as "expiresAt",
          o."createdAt",
          o."updatedAt",
          o."cancelledBy",
          o."cancellationReason",
          p.id as "productId",
          p.name as "productName",
          c.name as "productCategory",
          pi."imageData" as "productImage",
          buyer.id as "buyerId",
          buyer.name as "buyerName",
          buyer.email as "buyerEmail",
          buyer."userType" as "buyerType",
          buyer."accountType" as "buyerAccountType",
          buyer_profile."profileImage" as "buyerImage",
          seller.id as "sellerId",
          seller.name as "sellerName",
          seller.email as "sellerEmail",
          seller."userType" as "sellerType",
          seller."accountType" as "sellerAccountType",
          seller_profile."profileImage" as "sellerImage"
        FROM offers o
        INNER JOIN products p ON o."productId" = p.id
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN product_images pi ON p.id = pi."productId" AND pi."isPrimary" = true
        INNER JOIN users buyer ON o."buyerId" = buyer.id
        LEFT JOIN user_profiles buyer_profile ON buyer.id = buyer_profile."userId"
        INNER JOIN users seller ON o."sellerId" = seller.id
        LEFT JOIN user_profiles seller_profile ON seller.id = seller_profile."userId"
        WHERE (o."buyerId" = ${user.userId} OR o."sellerId" = ${user.userId})
        ORDER BY o."createdAt" DESC
      `;
      offers = allOffersResult;
    }

    console.log('🔍 Offers API - Query successful, found', offers.length, 'offers');

    const transformedOffers = offers.map((offer: any) => ({
      id: offer.id,
      conversationId: offer.conversationId,
      offerPrice: parseFloat(offer.offerPrice?.toString() || '0'),
      quantity: offer.quantity,
      message: offer.message,
      status: offer.status,
      deliveryOptions: offer.deliveryOptions || [],
      paymentTerms: offer.paymentTerms || [],
      expiresAt: offer.expiresAt,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      cancelledBy: offer.cancelledBy,
      cancellationReason: offer.cancellationReason,
      product: {
        id: offer.productId,
        name: offer.productName || 'Unknown Product',
        category: offer.productCategory || 'Uncategorized',
        image: offer.productImage || '/api/placeholder/400/300'
      },
      buyer: {
        id: offer.buyerId,
        name: offer.buyerName || 'Unknown Buyer',
        userType: offer.buyerType || 'farmer',
        accountType: offer.buyerAccountType || 'individual',
        profileImage: offer.buyerImage || '/api/placeholder/150/150'
      },
      seller: {
        id: offer.sellerId,
        name: offer.sellerName || 'Unknown Seller',
        userType: offer.sellerType || 'farmer',
        accountType: offer.sellerAccountType || 'individual',
        profileImage: offer.sellerImage || '/api/placeholder/150/150'
      }
    }));

    return NextResponse.json({
      offers: transformedOffers,
      message: 'Offers fetched successfully'
    });

  } catch (error: any) {
    const { searchParams } = new URL(request.url);
    console.error('❌ Error fetching offers:', {
      message: error.message,
      stack: error.stack,
      query: searchParams.get('conversationId') ? 'conversationId query' : 'other query',
      conversationId: searchParams.get('conversationId') || 'none'
    });
    return NextResponse.json(
      { message: 'Internal server error', error: error.message, details: error.stack },
      { status: 500 }
    );
  }
}

// POST /api/offers - Create new offer
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Offers API - POST request received');
    
    const user = await verifyTokenApi(request);
    if (!user) {
      console.log('❌ Offers API - User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Offers API - User authenticated:', user.id);
    const body = await request.json();
    const {
      productId,
      offerPrice,
      quantity,
      message,
      deliveryAddress,
      deliveryOptions,
      paymentTerms,
      expirationHours
    } = body;

    // Validate required fields
    if (!productId || !offerPrice || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate quantity is a positive number
    const quantityNum = typeof quantity === 'number' ? quantity : parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { message: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Get product and seller info using normalized structure
    const product = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sellerId: productsTable.sellerId,
        sellerType: productsTable.sellerType,
        sellerName: productsTable.sellerName,
        availableStock: productsTable.availableStock,
      })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = product[0];

    // Prevent users from making offers on their own products
    if (productData.sellerId === user.id) {
      return NextResponse.json(
        { message: 'Cannot make offer on your own product' },
        { status: 400 }
      );
    }

    // Validate quantity against available stock
    const availableStock = productData.availableStock ? parseInt(productData.availableStock) : 0;
    
    // Calculate actual available stock by subtracting pending/accepted offers
    const pendingOffersResult = await sql`
      SELECT COALESCE(SUM(quantity), 0) as total_offered
      FROM offers 
      WHERE "productId" = ${productId} 
      AND status IN ('pending', 'accepted')
    `;
    
    const totalOffered = Number(pendingOffersResult[0]?.total_offered) || 0;
    const actualAvailable = Math.max(0, availableStock - totalOffered);
    
    // Validate offer quantity doesn't exceed available stock
    if (quantityNum > actualAvailable) {
      return NextResponse.json(
        { 
          message: `Quantity cannot exceed available stock. Available: ${actualAvailable}, Requested: ${quantityNum}`,
          availableStock: actualAvailable
        },
        { status: 400 }
      );
    }

    // Check if user is a farmer (farmers can't make offers, only traders/buyers can)
    const currentUser = await db
      .select({
        userType: usersTable.userType,
      })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    // Only buyers and traders can make offers (farmers sell products)
    if (currentUser.length > 0 && currentUser[0].userType === 'farmer') {
      return NextResponse.json(
        { message: 'Farmers cannot make offers, they sell products' },
        { status: 400 }
      );
    }

    // Get or create conversation between buyer and seller
    let conversationId;
    const existingConversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          and(eq(conversations.buyerId, user.id), eq(conversations.sellerId, productData.sellerId)),
          and(eq(conversations.buyerId, productData.sellerId), eq(conversations.sellerId, user.id))
        )
      )
      .limit(1);
    
    if (existingConversation.length > 0) {
      conversationId = existingConversation[0].id;
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(conversations)
        .values({
          buyerId: user.id,
          sellerId: productData.sellerId,
          productId: productId,
        })
        .returning({ id: conversations.id });
      conversationId = newConversation[0].id;
    }

    // Create the offer using normalized structure
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + (expirationHours || 24));

    const newOffer = await db
      .insert(offersTable)
      .values({
        productId: productId,
        buyerId: user.id,
        sellerId: productData.sellerId,
        conversationId: conversationId,
        offerPrice: offerPrice.toString(),
        quantity: quantityNum,
        message: message || null,
        status: 'pending',
        deliveryAddress: deliveryAddress || null,
        deliveryOptions: deliveryOptions || null,
        paymentTerms: paymentTerms || null,
        expiresAt: expirationDate,
      })
      .returning();

    // Get current unread count and update conversation with offer activity
    const currentConv = await db
      .select({ unreadCount: conversations.unreadCount })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    const currentUnreadCount = currentConv[0]?.unreadCount || 0;
    const recipientId = productData.sellerId === user.id ? 
      (await db.select({ buyerId: conversations.buyerId }).from(conversations).where(eq(conversations.id, conversationId)).limit(1))[0]?.buyerId :
      productData.sellerId;
    
    const isRecipient = recipientId !== user.id;

    await db
      .update(conversations)
      .set({
        lastMessage: `New offer: ${offerPrice} for ${quantity} units - ${message || 'No message'}`,
        lastMessageTime: new Date(),
        unreadCount: isRecipient ? currentUnreadCount + 1 : currentUnreadCount,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));

    // Send notification to seller about new offer
    try {
      await offerNotificationService.createOfferNotification(
        productData.sellerId,
        newOffer[0].id,
        'offer_created',
        productData.name,
        user.name || 'Unknown User'
      );
      console.log('🔔 Notification sent for new offer creation');
    } catch (notificationError) {
      console.error('❌ Failed to send offer creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      offer: {
        id: newOffer[0].id,
        conversationId: newOffer[0].conversationId,
        offerPrice: parseFloat(newOffer[0].offerPrice?.toString() || '0'),
        quantity: newOffer[0].quantity,
        message: newOffer[0].message,
        status: newOffer[0].status,
        deliveryOptions: newOffer[0].deliveryOptions || [],
        paymentTerms: newOffer[0].paymentTerms || [],
        expiresAt: newOffer[0].expiresAt,
        createdAt: newOffer[0].createdAt,
        updatedAt: newOffer[0].updatedAt
      },
      message: 'Offer created successfully'
    });

  } catch (error: any) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}