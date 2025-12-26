import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { offerComplaints, offers } from '@/lib/db/schema';
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

// POST /api/offers/[id]/complaint - Create a complaint
export async function POST(
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
    const { complaintType, reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { message: 'Complaint reason is required' },
        { status: 400 }
      );
    }

    // Verify the offer exists and user has permission
    const offerResult = await sql`
      SELECT 
        o.id,
        o."buyerId",
        o."sellerId",
        o.status
      FROM offers o
      WHERE o.id = ${offerId}
    `;
    
    const [offer] = offerResult;

    if (!offer) {
      return NextResponse.json(
        { message: 'Offer not found' },
        { status: 404 }
      );
    }

    // Only buyer can file complaints
    const isBuyer = offer.buyerId === user.userId;
    if (!isBuyer) {
      return NextResponse.json(
        { message: 'Only buyers can file complaints' },
        { status: 403 }
      );
    }

    // Validate complaint type and offer status
    if (complaintType === 'unfair_cancellation') {
      // Unfair cancellation complaints only for cancelled orders
      if (offer.status !== 'cancelled') {
        return NextResponse.json(
          { message: 'Unfair cancellation complaints can only be filed for cancelled orders' },
          { status: 400 }
        );
      }
    } else if (complaintType === 'delivery_issue') {
      // Order issue complaints only for delivered orders
      if (offer.status !== 'delivered') {
        return NextResponse.json(
          { message: 'Order issue complaints can only be filed for delivered orders' },
          { status: 400 }
        );
      }
    }

    // Check if complaint already exists
    const existingComplaint = await db
      .select()
      .from(offerComplaints)
      .where(
        and(
          eq(offerComplaints.offerId, offerId),
          eq(offerComplaints.raisedBy, user.userId)
        )
      )
      .limit(1);

    if (existingComplaint.length > 0) {
      return NextResponse.json(
        { message: 'You have already filed a complaint for this offer' },
        { status: 400 }
      );
    }

    // Create the complaint
    const [newComplaint] = await db
      .insert(offerComplaints)
      .values({
        offerId: offerId,
        raisedBy: user.userId,
        reportedUserId: offer.sellerId,
        complaintType: complaintType || 'unfair_cancellation',
        reason: reason.trim(),
        status: 'submitted'
      })
      .returning();

    // Send notification to seller about the complaint
    try {
      // Get buyer name and product name for notification
      const [buyerInfo] = await sql`
        SELECT name FROM users WHERE id = ${user.userId}
      `;
      
      const [productInfo] = await sql`
        SELECT p.name 
        FROM products p
        INNER JOIN offers o ON p.id = o."productId"
        WHERE o.id = ${offerId}
      `;

      const buyerName = buyerInfo?.name || 'A buyer';
      const productName = productInfo?.name || 'your product';
      const complaintTypeLabel = complaintType === 'delivery_issue' ? 'Order Issue' : 'Complaint';
      
      await offerNotificationService.createOfferNotification(
        offer.sellerId,
        offerId,
        'offer_created', // Using existing type, but with custom message
        productName,
        buyerName,
        `${complaintTypeLabel} Filed`,
        `${buyerName} has filed a ${complaintTypeLabel.toLowerCase()} for order "${productName}". Please review the issue.`,
        `/offers/${offerId}`
      );
      
      console.log(`🔔 Notification sent to seller ${offer.sellerId} about ${complaintTypeLabel.toLowerCase()}`);
    } catch (notificationError) {
      console.error('❌ Failed to send complaint notification to seller:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      complaint: {
        id: newComplaint.id,
        offerId: newComplaint.offerId,
        complaintType: newComplaint.complaintType,
        status: newComplaint.status,
        createdAt: newComplaint.createdAt
      },
      message: 'Complaint submitted successfully. Our support team will review your case. (Note: Full complaint resolution system is in post-MVP development)'
    });

  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/offers/[id]/complaint - Get complaint for an offer
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

    // Verify the offer exists
    const offerResult = await sql`
      SELECT "buyerId", "sellerId" FROM offers WHERE id = ${offerId}
    `;
    
    if (offerResult.length === 0) {
      return NextResponse.json(
        { message: 'Offer not found' },
        { status: 404 }
      );
    }

    const offer = offerResult[0];
    const isBuyer = offer.buyerId === user.userId;
    const isSeller = offer.sellerId === user.userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get complaint (buyer sees their own, seller sees if buyer complained)
    const complaints = await db
      .select()
      .from(offerComplaints)
      .where(eq(offerComplaints.offerId, offerId))
      .limit(1);

    if (complaints.length === 0) {
      return NextResponse.json({
        complaint: null,
        message: 'No complaint found'
      });
    }

    const complaint = complaints[0];
    
    // Buyer can see their own complaint, seller can see if buyer complained
    if (isBuyer && complaint.raisedBy === user.userId) {
      return NextResponse.json({
        complaint: {
          id: complaint.id,
          complaintType: complaint.complaintType,
          reason: complaint.reason,
          status: complaint.status,
          createdAt: complaint.createdAt
        },
        message: 'Complaint retrieved successfully'
      });
    }

    if (isSeller && complaint.reportedUserId === user.userId) {
      // Seller sees that a complaint was filed
      // For delivery issues, show reason; for cancellation complaints, don't show reason
      const showReason = complaint.complaintType === 'delivery_issue';
      return NextResponse.json({
        complaint: {
          id: complaint.id,
          complaintType: complaint.complaintType,
          status: complaint.status,
          createdAt: complaint.createdAt,
          reason: showReason ? complaint.reason : undefined, // Show reason for delivery issues
        },
        message: 'Complaint retrieved successfully'
      });
    }

    return NextResponse.json({
      complaint: null,
      message: 'No complaint found'
    });

  } catch (error: any) {
    console.error('Error fetching complaint:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

