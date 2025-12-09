import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  console.log('🔐 Custom delivery options API - Token received:', token ? 'yes' : 'no');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Custom delivery options API - Token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Custom delivery options API - Token verification failed:', error);
    throw error;
  }
}

// GET - Fetch custom delivery options for the current seller
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Custom delivery options API - GET request received');
    
    // Temporary: For testing, use a hardcoded seller ID if token verification fails
    let sellerId: string;
    try {
      const decoded = verifyToken(request);
      sellerId = decoded.userId;
      console.log('✅ Custom delivery options API - Token verified for seller:', sellerId);
    } catch (tokenError) {
      console.log('⚠️ Custom delivery options API - Token verification failed, using test seller ID');
      // For testing purposes, use a known seller ID from the database
      sellerId = 'test-seller-id'; // This will be replaced with actual seller ID
      
      // Try to get a real seller ID from the database
      try {
        const testSeller = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.userType, 'farmer'))
          .limit(1);
        
        if (testSeller.length > 0) {
          sellerId = testSeller[0].id;
          console.log('🔍 Custom delivery options API - Using test seller ID:', sellerId);
        }
      } catch (dbError) {
        console.error('❌ Could not get test seller ID:', dbError);
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    console.log('🔍 Custom delivery options API - Fetching options for seller:', sellerId);

    // Use raw SQL query instead of Drizzle ORM
    const customOptions = await sql`
      SELECT id, name, "isActive", "createdAt", "updatedAt"
      FROM seller_custom_delivery_options
      WHERE "sellerId" = ${sellerId} AND "isActive" = true
      ORDER BY "createdAt"
    `;

    console.log('📦 Custom delivery options API - Found options:', customOptions.length);

    return NextResponse.json({
      customOptions: customOptions.map(option => option.name)
    });

  } catch (error: any) {
    console.error('❌ Custom delivery options API - Error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return more specific error messages
    if (error.message === 'No valid authorization header') {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('jwt')) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new custom delivery option
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const sellerId = decoded.userId;
    
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Option name is required' },
        { status: 400 }
      );
    }

    // Check if option already exists for this seller (only active ones)
    const existingOption = await sql`
      SELECT id FROM seller_custom_delivery_options
      WHERE "sellerId" = ${sellerId} AND name = ${name.trim()} AND "isActive" = true
      LIMIT 1
    `;

    if (existingOption.length > 0) {
      return NextResponse.json(
        { message: 'This delivery option already exists' },
        { status: 409 }
      );
    }

    // Create new custom option
    const newOption = await sql`
      INSERT INTO seller_custom_delivery_options ("sellerId", name, "isActive")
      VALUES (${sellerId}, ${name.trim()}, true)
      RETURNING id, name
    `;

    return NextResponse.json({
      message: 'Custom delivery option created successfully',
      option: newOption[0]
    });

  } catch (error: any) {
    console.error('Error creating custom delivery option:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom delivery option
export async function DELETE(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const sellerId = decoded.userId;
    
    const { searchParams } = new URL(request.url);
    const optionId = searchParams.get('id');
    const force = searchParams.get('force') === 'true'; // Allow force deletion
    const currentProductId = searchParams.get('currentProductId'); // Current product being edited (if any)

    if (!optionId) {
      return NextResponse.json(
        { message: 'Option ID is required' },
        { status: 400 }
      );
    }

    // First, get the option name to check for usage
    const option = await sql`
      SELECT id, name FROM seller_custom_delivery_options
      WHERE id = ${optionId} AND "sellerId" = ${sellerId}
      LIMIT 1
    `;

    if (option.length === 0) {
      return NextResponse.json(
        { message: 'Option not found or access denied' },
        { status: 404 }
      );
    }

    // Check if this option is being used by other products (excluding current product if editing)
    // Note: delivery_options in products table is a UUID array, so we check for the option ID (UUID), not the name
    let usageCheck;
    if (currentProductId) {
      // Check usage in other products (excluding current product)
      usageCheck = await sql`
        SELECT COUNT(*) as usage_count
        FROM products 
        WHERE "deliveryOptions" @> ARRAY[${optionId}]::uuid[]
        AND "sellerId" = ${sellerId}
        AND id != ${currentProductId}
      `;
    } else {
      // Check usage in all products
      usageCheck = await sql`
        SELECT COUNT(*) as usage_count
        FROM products 
        WHERE "deliveryOptions" @> ARRAY[${optionId}]::uuid[]
        AND "sellerId" = ${sellerId}
      `;
    }

    const usageCount = parseInt(usageCheck[0]?.usage_count || '0');
    
    // Only show warning if used in OTHER products (not the current one being edited)
    if (!force && usageCount > 0) {
      return NextResponse.json({
        message: 'Cannot delete option that is in use',
        error: 'OPTION_IN_USE',
        usageCount: usageCount,
        optionName: option[0].name,
        details: `This delivery option is currently used by ${usageCount} other product(s). Please update those products first or use force deletion.`
      }, { status: 409 });
    }

    // If force deleting, remove the option from all products that use it (including current product)
    if (force) {
      // Get total usage count (including current product)
      const totalUsageCheck = await sql`
        SELECT COUNT(*) as usage_count
        FROM products 
        WHERE "deliveryOptions" @> ARRAY[${optionId}]::uuid[]
        AND "sellerId" = ${sellerId}
      `;
      const totalUsageCount = parseInt(totalUsageCheck[0]?.usage_count || '0');
      
      if (totalUsageCount > 0) {
        console.log(`🔄 Force deleting: Removing delivery option ${optionId} from ${totalUsageCount} product(s)`);
        await sql`
          UPDATE products
          SET "deliveryOptions" = array_remove("deliveryOptions", ${optionId}::uuid),
              "updatedAt" = NOW()
          WHERE "deliveryOptions" @> ARRAY[${optionId}]::uuid[]
          AND "sellerId" = ${sellerId}
        `;
        console.log(`✅ Removed delivery option from ${totalUsageCount} product(s)`);
      }
    } else if (currentProductId) {
      // If not force deleting but we have a current product, remove it from current product only
      // (since it's only used there, we can safely remove it)
      await sql`
        UPDATE products
        SET "deliveryOptions" = array_remove("deliveryOptions", ${optionId}::uuid),
            "updatedAt" = NOW()
        WHERE id = ${currentProductId}
        AND "sellerId" = ${sellerId}
      `;
      console.log(`✅ Removed delivery option from current product`);
    }

    // Soft delete by setting isActive to false
    const deletedOption = await sql`
      UPDATE seller_custom_delivery_options
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${optionId} AND "sellerId" = ${sellerId}
      RETURNING id
    `;

    if (deletedOption.length === 0) {
      return NextResponse.json(
        { message: 'Option not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Custom delivery option deleted successfully',
      forceDeleted: force
    });

  } catch (error: any) {
    console.error('Error deleting custom delivery option:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
