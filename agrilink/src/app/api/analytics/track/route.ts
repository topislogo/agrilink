import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';
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

// POST /api/analytics/track - Track an analytics event
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request); // Optional - can be anonymous
    const body = await request.json();
    const { eventType, targetId, metadata } = body;

    if (!eventType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType and targetId' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['profile_view', 'product_view'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert analytics event
    const [event] = await db
      .insert(analyticsEvents)
      .values({
        eventType,
        targetId,
        viewerId: user?.userId || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      event: event
    });

  } catch (error: any) {
    console.error('Analytics track API error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event', details: error.message },
      { status: 500 }
    );
  }
}

