import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sellerCustomDeliveryOptions, sellerCustomPaymentTerms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// GET - Get custom options for the authenticated seller
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract and verify the JWT token
    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get custom delivery options for this seller
    const customDeliveryOptions = await db
      .select()
      .from(sellerCustomDeliveryOptions)
      .where(and(
        eq(sellerCustomDeliveryOptions.sellerId, userId),
        eq(sellerCustomDeliveryOptions.isActive, true)
      ))
      .orderBy(sellerCustomDeliveryOptions.name);

    // Get custom payment terms for this seller
    const customPaymentTerms = await db
      .select()
      .from(sellerCustomPaymentTerms)
      .where(and(
        eq(sellerCustomPaymentTerms.sellerId, userId),
        eq(sellerCustomPaymentTerms.isActive, true)
      ))
      .orderBy(sellerCustomPaymentTerms.name);

    return NextResponse.json({
      success: true,
      customDeliveryOptions,
      customPaymentTerms
    });

  } catch (error: any) {
    console.error('Error fetching custom options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom options' },
      { status: 500 }
    );
  }
}

// POST - Add a new custom option
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract and verify the JWT token
    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { type, name, description } = await request.json();

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    if (type === 'delivery') {
      // Add custom delivery option
      const newOption = await db
        .insert(sellerCustomDeliveryOptions)
        .values({
          sellerId: userId,
          name: name.trim(),
          description: description?.trim() || null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        option: newOption[0],
        message: 'Custom delivery option added successfully'
      });

    } else if (type === 'payment') {
      // Add custom payment term
      const newOption = await db
        .insert(sellerCustomPaymentTerms)
        .values({
          sellerId: userId,
          name: name.trim(),
          description: description?.trim() || null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        option: newOption[0],
        message: 'Custom payment term added successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "delivery" or "payment"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error adding custom option:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This option already exists for your account' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add custom option' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a custom option
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract and verify the JWT token
    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and id are required' },
        { status: 400 }
      );
    }

    if (type === 'delivery') {
      // Delete custom delivery option
      const result = await db
        .delete(sellerCustomDeliveryOptions)
        .where(and(
          eq(sellerCustomDeliveryOptions.id, id),
          eq(sellerCustomDeliveryOptions.sellerId, userId)
        ));

      return NextResponse.json({
        success: true,
        message: 'Custom delivery option removed successfully'
      });

    } else if (type === 'payment') {
      // Delete custom payment term
      const result = await db
        .delete(sellerCustomPaymentTerms)
        .where(and(
          eq(sellerCustomPaymentTerms.id, id),
          eq(sellerCustomPaymentTerms.sellerId, userId)
        ));

      return NextResponse.json({
        success: true,
        message: 'Custom payment term removed successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "delivery" or "payment"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error removing custom option:', error);
    return NextResponse.json(
      { error: 'Failed to remove custom option' },
      { status: 500 }
    );
  }
}
