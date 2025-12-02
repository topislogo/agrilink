import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { addresses as addressesTable, locations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// GET /api/user/addresses - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // For development mode, allow any token
    let user;
    if (process.env.NODE_ENV === 'development') {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET!) as any;
      } catch (error) {
        // If token verification fails in development, return null to force re-authentication
        return null;
      }
    } else {
      user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    }

    // Now use Drizzle ORM with camelCase columns
    const addresses = await db
      .select({
        id: addressesTable.id,
        userId: addressesTable.userId,
        locationId: addressesTable.locationId,
        addressLine1: addressesTable.addressLine1,
        addressLine2: addressesTable.addressLine2,
        phoneNumber: addressesTable.phoneNumber,
        addressType: addressesTable.addressType,
        isDefault: addressesTable.isDefault,
        createdAt: addressesTable.createdAt,
        updatedAt: addressesTable.updatedAt,
        // Join with locations table to get city and region
        city: locations.city,
        region: locations.region
      })
      .from(addressesTable)
      .leftJoin(locations, eq(addressesTable.locationId, locations.id))
      .where(eq(addressesTable.userId, user.userId))
      .orderBy(desc(addressesTable.isDefault), desc(addressesTable.createdAt));

    return NextResponse.json({
      addresses: addresses.map(addr => ({
        id: addr.id,
        addressType: addr.addressType || 'home',
        label: `${addr.addressType || 'home'} address`, // This will be updated when we store labels
        fullName: '', // This will be updated when we store full names
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city || '',
        state: addr.region || '',
        postalCode: '', // This will be updated when we store postal codes
        phone: addr.phoneNumber,
        isDefault: addr.isDefault || false,
        location: addr.city && addr.region ? `${addr.city}, ${addr.region}` : null,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt
      })),
      message: 'Addresses fetched successfully'
    });

  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/user/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // For development mode, allow any token
    let user;
    if (process.env.NODE_ENV === 'development') {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET!) as any;
      } catch (error) {
        // If token verification fails in development, return null to force re-authentication
        return null;
      }
    } else {
      user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    }

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
      isDefault
    } = body;

    // Validate required fields
    if (!addressLine1 || !city || !state) {
      return NextResponse.json(
        { message: 'Missing required fields: addressLine1, city, and state are required' },
        { status: 400 }
      );
    }

    // Find or create location
    let locationId = null;
    if (city && state) {
      try {
        // First, try to find existing location
        const existingLocation = await db
          .select({ id: locations.id })
          .from(locations)
          .where(eq(locations.city, city))
          .limit(1);

        if (existingLocation.length > 0) {
          locationId = existingLocation[0].id;
        } else {
          // Create new location
          const [newLocation] = await db
            .insert(locations)
            .values({
              city: city,
              region: state
            })
            .returning({ id: locations.id });
          locationId = newLocation.id;
        }
      } catch (error) {
        console.error('Error handling location:', error);
        // Continue without location if there's an error
      }
    }

    // Create the address using Drizzle ORM with camelCase columns
    const [newAddress] = await db
      .insert(addressesTable)
      .values({
        userId: user.userId,
        locationId: locationId,
        addressType: addressType || 'home',
        addressLine1: addressLine1,
        addressLine2: addressLine2 || null,
        phoneNumber: phone || null,
        isDefault: isDefault || false
      })
      .returning();

    return NextResponse.json({
      address: {
        id: newAddress.id,
        addressType: newAddress.addressType,
        label: label || `${addressType} address`,
        fullName: fullName || '',
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        city: city,
        state: state,
        postalCode: postalCode || '',
        phone: newAddress.phoneNumber,
        isDefault: newAddress.isDefault,
        location: city && state ? `${city}, ${state}` : null,
        createdAt: newAddress.createdAt,
        updatedAt: newAddress.updatedAt
      },
      message: 'Address created successfully'
    });

  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
