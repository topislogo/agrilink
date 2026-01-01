import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents, conversations, products } from '@/lib/db/schema';
import { eq, and, gte, sql, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

// GET /api/analytics/user/[userId] - Get analytics for a user (seller)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: sellerId } = await params;

    console.log('📊 Analytics API - Requested userId:', sellerId);
    console.log('📊 Analytics API - Authenticated userId:', user.userId);

    // Only allow users to view their own analytics
    if (user.userId !== sellerId) {
      console.log('❌ Analytics API - User ID mismatch:', { requested: sellerId, authenticated: user.userId });
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own analytics' },
        { status: 403 }
      );
    }

    // Calculate start of current month (in UTC to match database timestamps)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    console.log('📊 Analytics API - Date range:', {
      startOfMonth: startOfMonth.toISOString(),
      now: now.toISOString()
    });

    // Get monthly profile views
    const monthlyProfileViews = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'profile_view'),
          eq(analyticsEvents.targetId, sellerId),
          gte(analyticsEvents.createdAt, startOfMonth)
        )
      );

    // Get monthly product views (for seller's products)
    // First get all product IDs for this seller
    const sellerProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sellerId, sellerId));
    
    const productIds = sellerProducts.map(p => p.id);
    
    // Then count product views for these products
    const monthlyProductViewsResult = productIds.length > 0
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'product_view'),
              inArray(analyticsEvents.targetId, productIds),
              gte(analyticsEvents.createdAt, startOfMonth)
            )
          )
      : [{ count: 0 }];
    
    const monthlyProductViews = monthlyProductViewsResult[0] || { count: 0 };

    // Get monthly inquiries (conversations started this month where user is seller)
    const monthlyInquiries = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(
        and(
          eq(conversations.sellerId, sellerId),
          gte(conversations.createdAt, startOfMonth)
        )
      );

    console.log('📊 Analytics API - Counts:', {
      monthlyInquiries: Number(monthlyInquiries[0]?.count || 0),
      monthlyProfileViews: Number(monthlyProfileViews[0]?.count || 0),
      monthlyProductViews: Number(monthlyProductViews.count || 0)
    });

    return NextResponse.json({
      monthlyInquiries: Number(monthlyInquiries[0]?.count || 0),
      monthlyProfileViews: Number(monthlyProfileViews[0]?.count || 0),
      monthlyProductViews: Number(monthlyProductViews.count || 0),
    });

  } catch (error: any) {
    console.error('Analytics user API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}

