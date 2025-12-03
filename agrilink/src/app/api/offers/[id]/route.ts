import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { offers as offersTable, products as productsTable, productImages, users as usersTable, userProfiles, categories, offerTimeline } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { offerNotificationService } from '@/services/offerNotificationService';

function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return user;
  } catch (error: any) {
    return null;
  }
}

// PUT /api/offers/[id] - Update offer status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: offerId } = await params;
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, cancellationReason } = body;

    console.log('🔍 Update offer API - Request:', {
      offerId,
      userId: user.userId,
      status,
      cancellationReason
    });

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'to_ship', 'shipped', 'delivered', 'received', 'completed', 'cancelled', 'expired'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if offer exists and user has permission to update it
    const existingOfferResult = await sql`
      SELECT 
        o.id,
        o."buyerId",
        o."sellerId",
        o.status,
        p.name as "productName",
        buyer.name as "buyerName",
        seller.name as "sellerName"
      FROM offers o
      INNER JOIN products p ON o."productId" = p.id
      INNER JOIN users buyer ON o."buyerId" = buyer.id
      INNER JOIN users seller ON o."sellerId" = seller.id
      WHERE o.id = ${offerId}
    `;
    
    const [existingOffer] = existingOfferResult;

    if (!existingOffer) {
      return NextResponse.json(
        { message: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if user is the seller (can accept/reject) or buyer (can update their own offers)
    const isSeller = existingOffer.sellerId === user.userId;
    const isBuyer = existingOffer.buyerId === user.userId;

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Forbidden - You can only update your own offers or offers on your products' },
        { status: 403 }
      );
    }

    // Get current offer to check delivery options
    const currentOfferResult = await sql`
      SELECT "deliveryOptions" FROM offers WHERE id = ${offerId}
    `;
    
    const [currentOffer] = currentOfferResult;

    // Auto-complete logic: if buyer marks as "received", automatically complete the transaction
    let finalStatus = status;
    
    if (status === 'received') {
      // For items marked as received by buyer, auto-complete
      finalStatus = 'completed';
    }

    // Update the offer with new status workflow using Drizzle
    const updateData: any = {
      status: finalStatus,
      updatedAt: new Date()
    };

    // Add cancellation details if cancelling
    if (finalStatus === 'cancelled') {
      // Validate cancellation reason for sellers
      if (isSeller && (!cancellationReason || cancellationReason.trim().length < 10)) {
        return NextResponse.json(
          { message: 'Cancellation reason is required and must be at least 10 characters for seller cancellations' },
          { status: 400 }
        );
      }
      
      updateData.cancelledBy = user.userId;
      updateData.cancellationReason = cancellationReason || null;
    }

    // Note: Timestamp fields like acceptedAt, readyToShipAt, etc. are not in the current schema
    // They would need to be added to the offers table if needed for tracking

    const [updatedOffer] = await db
      .update(offersTable)
      .set(updateData)
      .where(eq(offersTable.id, offerId))
      .returning();

    console.log('✅ Offer updated successfully:', updatedOffer.id);

    // Add timeline entry for status change
    const statusEventMapping = {
      'pending': { eventType: 'created', description: 'Created' },
      'accepted': { eventType: 'accepted', description: 'Accepted' },
      'rejected': { eventType: 'rejected', description: 'Rejected' },
      'to_ship': { eventType: 'preparing', description: 'To ship' },
      'shipped': { eventType: 'shipped', description: 'Shipped' },
      'delivered': { eventType: 'delivered', description: 'Delivered' },
      'received': { eventType: 'received', description: 'Received' },
      'completed': { eventType: 'completed', description: 'Completed' },
      'cancelled': { eventType: 'cancelled', description: 'Cancelled' },
      'expired': { eventType: 'expired', description: 'Expired' }
    };

    const eventInfo = statusEventMapping[finalStatus as keyof typeof statusEventMapping] || { 
      eventType: 'status_updated', 
      description: `Status changed to ${finalStatus}` 
    };
    
    await db.insert(offerTimeline).values({
      offerId: offerId,
      eventType: eventInfo.eventType,
      eventDescription: eventInfo.description,
      eventData: {
        oldStatus: existingOffer.status,
        newStatus: finalStatus,
        changedBy: user.userId,
        changedAt: new Date().toISOString()
      },
      userId: user.userId
    });

    console.log('✅ Timeline entry added for status change:', finalStatus);

    // Send notifications for ALL status changes
    try {
      const productName = existingOffer.productName;
      const otherPartyName = isSeller ? existingOffer.buyerName : existingOffer.sellerName;
      const otherPartyId = isSeller ? existingOffer.buyerId : existingOffer.sellerId;

      // Create notification for any status change
      let notificationType = 'offer_created'; // default
      let title = '';
      let message = '';

      switch (finalStatus) {
        case 'accepted':
          notificationType = 'offer_accepted';
          title = 'Offer Accepted';
          message = `${otherPartyName} accepted your offer for "${productName}"`;
          break;
        case 'rejected':
          notificationType = 'offer_rejected';
          title = 'Offer Rejected';
          message = `${otherPartyName} rejected your offer for "${productName}"`;
          break;
        case 'to_ship':
          notificationType = 'offer_created'; // We'll use a custom type
          title = 'Ready to Ship';
          message = `Your order for "${productName}" is ready to ship`;
          break;
        case 'shipped':
          notificationType = 'offer_created'; // We'll use a custom type
          title = 'Order Shipped';
          message = `Your order for "${productName}" has been shipped`;
          break;
        case 'delivered':
          notificationType = 'offer_created'; // We'll use a custom type
          title = 'Order Delivered';
          message = `Your order for "${productName}" has been delivered`;
          break;
        case 'received':
          notificationType = 'offer_created'; // We'll use a custom type
          title = 'Order Received';
          message = `Your order for "${productName}" has been received`;
          break;
        case 'completed':
          notificationType = 'offer_created'; // We'll use a custom type
          title = 'Order Completed';
          message = `Your order for "${productName}" has been completed`;
          break;
        case 'cancelled':
          notificationType = 'offer_rejected'; // Similar to rejected
          title = 'Order Cancelled';
          message = `Your order for "${productName}" has been cancelled`;
          break;
        case 'expired':
          notificationType = 'offer_expired';
          title = 'Offer Expired';
          message = `Your offer for "${productName}" has expired`;
          break;
        default:
          // For any other status changes
          title = 'Status Updated';
          message = `Status updated to ${finalStatus} for "${productName}"`;
      }

      // Send notification to the other party
      await offerNotificationService.createOfferNotification(
        otherPartyId,
        offerId,
        notificationType as any,
        productName,
        isSeller ? existingOffer.sellerName : existingOffer.buyerName,
        title,
        message
      );

      console.log('🔔 Notification sent for offer status change:', finalStatus);
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      offer: {
        id: updatedOffer.id,
        conversationId: updatedOffer.conversationId,
        offerPrice: parseFloat(updatedOffer.offerPrice?.toString() || '0'),
        quantity: updatedOffer.quantity,
        message: updatedOffer.message,
        status: updatedOffer.status,
        deliveryOptions: updatedOffer.deliveryOptions || [],
        paymentTerms: updatedOffer.paymentTerms || [],
        expiresAt: updatedOffer.expiresAt,
        createdAt: updatedOffer.createdAt,
        updatedAt: updatedOffer.updatedAt,
        cancelledBy: updatedOffer.cancelledBy,
        cancellationReason: updatedOffer.cancellationReason
      },
      message: 'Offer updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/offers/[id] - Get single offer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: offerId } = await params;
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const offerResult = await sql`
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
        CASE 
          WHEN buyer_ver.verified = true AND buyer."accountType" = 'business' THEN 'business-verified'
          WHEN buyer_ver.verified = true AND buyer."accountType" = 'individual' THEN 'id-verified'
          WHEN buyer_ver."verificationStatus" = 'under-review' THEN 'under-review'
          ELSE 'unverified'
        END as "buyerVerificationLevel",
        buyer_profile."profileImage" as "buyerImage",
        seller.id as "sellerId",
        seller.name as "sellerName",
        seller.email as "sellerEmail",
        seller."userType" as "sellerType",
        seller."accountType" as "sellerAccountType",
        CASE 
          WHEN seller_ver.verified = true AND seller."accountType" = 'business' THEN 'business-verified'
          WHEN seller_ver.verified = true AND seller."accountType" = 'individual' THEN 'id-verified'
          WHEN seller_ver."verificationStatus" = 'under-review' THEN 'under-review'
          ELSE 'unverified'
        END as "sellerVerificationLevel",
        seller_profile."profileImage" as "sellerImage"
      FROM offers o
      INNER JOIN products p ON o."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON p.id = pi."productId" AND pi."isPrimary" = true
      INNER JOIN users buyer ON o."buyerId" = buyer.id
      LEFT JOIN user_profiles buyer_profile ON buyer.id = buyer_profile."userId"
      LEFT JOIN user_verification buyer_ver ON buyer.id = buyer_ver."userId"
      INNER JOIN users seller ON o."sellerId" = seller.id
      LEFT JOIN user_profiles seller_profile ON seller.id = seller_profile."userId"
      LEFT JOIN user_verification seller_ver ON seller.id = seller_ver."userId"
      WHERE o.id = ${offerId}
    `;
    
    const [offer] = offerResult;

    if (!offer) {
      return NextResponse.json(
        { message: 'Offer not found' },
        { status: 404 }
      );
    }

    // Fetch timeline events for this offer (simplified query for better performance)
    const timelineResult = await sql`
      SELECT 
        ot.id,
        ot."eventType",
        ot."eventDescription",
        ot."eventData",
        ot."createdAt",
        u.name as "userName"
      FROM offer_timeline ot
      LEFT JOIN users u ON ot."userId" = u.id
      WHERE ot."offerId" = ${offerId}
      ORDER BY ot."createdAt" DESC
      LIMIT 10
    `;

    const timeline = timelineResult.map((event: any) => ({
      id: event.id,
      eventType: event.eventType,
      eventDescription: event.eventDescription,
      eventData: event.eventData,
      createdAt: event.createdAt,
      userName: event.userName
    }));

    // Check if user has permission to view this offer
    const isSeller = offer.sellerId === user.userId;
    const isBuyer = offer.buyerId === user.userId;

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      offer: {
        id: offer.id,
        conversationId: offer.conversationId,
        offerPrice: parseFloat(offer.offerPrice?.toString() || '0'),
        quantity: offer.quantity,
        message: offer.message,
        status: offer.status,
        deliveryAddress: offer.deliveryAddress,
        deliveryOptions: offer.deliveryOptions || [],
        paymentTerms: offer.paymentTerms || [],
        expiresAt: offer.expiresAt,
        // Timeline fields - these would come from offerTimeline table if needed
        acceptedAt: null,
        confirmedAt: null,
        readyToShipAt: null,
        readyToPickupAt: null,
        shippedAt: null,
        deliveredAt: null,
        completedAt: null,
        autoCompleteAt: null,
        statusUpdatedAt: offer.updatedAt, // Use updatedAt as fallback
        cancelledAt: null,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        cancelledBy: offer.cancelledBy,
        cancellationReason: offer.cancellationReason,
        productId: offer.productId,
        productName: offer.productName,
        productCategory: offer.productCategory,
        productImage: offer.productImage,
        buyerId: offer.buyerId,
        buyerName: offer.buyerName,
        buyerEmail: offer.buyerEmail,
        buyerUserType: offer.buyerType,
        buyerAccountType: offer.buyerAccountType,
        buyerVerificationLevel: offer.buyerVerificationLevel,
        buyerImage: offer.buyerImage,
        sellerId: offer.sellerId,
        sellerName: offer.sellerName,
        sellerEmail: offer.sellerEmail,
        sellerUserType: offer.sellerType,
        sellerAccountType: offer.sellerAccountType,
        sellerVerificationLevel: offer.sellerVerificationLevel,
        sellerImage: offer.sellerImage,
        product: {
          id: offer.productId,
          name: offer.productName,
          category: offer.productCategory,
          image: offer.productImage
        },
        buyer: {
          id: offer.buyerId,
          name: offer.buyerName,
          userType: offer.buyerType,
          accountType: offer.buyerAccountType,
          verificationLevel: offer.buyerVerificationLevel,
          profileImage: offer.buyerImage
        },
        seller: {
          id: offer.sellerId,
          name: offer.sellerName,
          userType: offer.sellerType,
          accountType: offer.sellerAccountType,
          verificationLevel: offer.sellerVerificationLevel,
          profileImage: offer.sellerImage
        },
        timeline: timeline
      },
      message: 'Offer fetched successfully'
    });

  } catch (error: any) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}