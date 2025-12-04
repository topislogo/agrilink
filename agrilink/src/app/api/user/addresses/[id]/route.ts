import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



// PUT /api/user/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id: addressId } = await params;

    const body = await request.json();
    const {
      addressType,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault
    } = body;

    // Validate required fields
    if (!label || !fullName || !addressLine1 || !city || !state) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if address belongs to user
    const [existingAddress] = await sql`
      SELECT "userId" FROM user_addresses 
      WHERE id = ${addressId} AND "userId" = ${user.userId}
    `;

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found or access denied' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await sql`
        UPDATE user_addresses 
        SET "isDefault" = false 
        WHERE "userId" = ${user.userId} AND id != ${addressId}
      `;
    }

    // Update the address
    const [updatedAddress] = await sql`
      UPDATE user_addresses SET
        "addressType" = ${addressType || 'home'},
        label = ${label},
        "fullName" = ${fullName},
        phone = ${phone || null},
        "addressLine1" = ${addressLine1},
        "addressLine2" = ${addressLine2 || null},
        city = ${city},
        state = ${state},
        "postalCode" = ${postalCode || null},
        country = ${country || 'Myanmar'},
        "isDefault" = ${isDefault || false},
        "updatedAt" = NOW()
      WHERE id = ${addressId} AND "userId" = ${user.userId}
      RETURNING *
    `;

    return NextResponse.json({
      address: {
        id: updatedAddress.id,
        addressType: updatedAddress.addressType,
        label: updatedAddress.label,
        fullName: updatedAddress.fullName,
        phone: updatedAddress.phone,
        addressLine1: updatedAddress.addressLine1,
        addressLine2: updatedAddress.addressLine2,
        city: updatedAddress.city,
        state: updatedAddress.state,
        postalCode: updatedAddress.postalCode,
        country: updatedAddress.country,
        isDefault: updatedAddress.isDefault,
        isActive: updatedAddress.isActive,
        createdAt: updatedAddress.createdAt,
        updatedAt: updatedAddress.updatedAt
      },
      message: 'Address updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/addresses/[id] - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id: addressId } = await params;

    // Check if address belongs to user
    const [existingAddress] = await sql`
      SELECT "userId", "isDefault" FROM user_addresses 
      WHERE id = ${addressId} AND "userId" = ${user.userId}
    `;

    if (!existingAddress) {
      return NextResponse.json(
        { message: 'Address not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await sql`
      UPDATE user_addresses 
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${addressId} AND "userId" = ${user.userId}
    `;

    return NextResponse.json({
      message: 'Address deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
