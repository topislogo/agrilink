import { NextRequest, NextResponse } from 'next/server';
import { addresses as addressesTable, locations } from '@/lib/db/schema';
import jwt from 'jsonwebtoken';
import { eq, desc } from 'drizzle-orm';
import { db,sql } from '@/lib/db';



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
     const updateData: any = {
        addressType,
        phone,
        addressLine1,
        addressLine2,
        isDefault
      };

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
          updateData.locationId = locationId;
        } 
      } catch (error) {
        console.error('Error handling location:', error);
        // Continue without location if there's an error
      }
    }  

    // Check if address belongs to user
    const existing = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId)).limit(1);
    if (existing.length > 0) {
      // Update existing record
        await db.update(addressesTable).set({...updateData}).where(eq(addressesTable.id, addressId));
      } 
      else{
        return NextResponse.json(
        { message: 'Address not found or access denied' },
        { status: 404 });
      }


return NextResponse.json({updateData})

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

    const existing = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId)).limit(1);
    if (existing.length > 0) {
      // Update existing record
        await db.delete(addressesTable).where(eq(addressesTable.id, addressId));
      } 
      else{
        return NextResponse.json(
        { message: 'Address not found or access denied' },
        { status: 404 });
      }

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
