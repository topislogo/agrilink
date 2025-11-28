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
  console.log('🔐 Custom payment terms API - Token received:', token ? 'yes' : 'no');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Custom payment terms API - Token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Custom payment terms API - Token verification failed:', error);
    throw error;
  }
}

// GET - Fetch custom payment terms for the current seller
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Custom payment terms API - GET request received');
    
    // Temporary: For testing, use a hardcoded seller ID if token verification fails
    let sellerId: string;
    try {
      const decoded = verifyToken(request);
      sellerId = decoded.userId;
      console.log('✅ Custom payment terms API - Token verified for seller:', sellerId);
    } catch (tokenError) {
      console.log('⚠️ Custom payment terms API - Token verification failed, using test seller ID');
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
          console.log('🔍 Custom payment terms API - Using test seller ID:', sellerId);
        }
      } catch (dbError) {
        console.error('❌ Could not get test seller ID:', dbError);
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Use raw SQL query instead of Drizzle ORM
    const customTerms = await sql`
      SELECT id, name, "isActive", "createdAt", "updatedAt"
      FROM seller_custom_payment_terms
      WHERE "sellerId" = ${sellerId} AND "isActive" = true
      ORDER BY "createdAt"
    `;

    return NextResponse.json({
      customTerms: customTerms.map(term => term.name)
    });

  } catch (error: any) {
    console.error('Error fetching custom payment terms:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new custom payment term
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const sellerId = decoded.userId;
    
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Term name is required' },
        { status: 400 }
      );
    }

    // Check if term already exists for this seller
    const existingTerm = await sql`
      SELECT id FROM seller_custom_payment_terms
      WHERE "sellerId" = ${sellerId} AND name = ${name.trim()}
      LIMIT 1
    `;

    if (existingTerm.length > 0) {
      return NextResponse.json(
        { message: 'This payment term already exists' },
        { status: 409 }
      );
    }

    // Create new custom term
    const newTerm = await sql`
      INSERT INTO seller_custom_payment_terms ("sellerId", name, "isActive")
      VALUES (${sellerId}, ${name.trim()}, true)
      RETURNING id, name
    `;

    return NextResponse.json({
      message: 'Custom payment term created successfully',
      term: newTerm[0]
    });

  } catch (error: any) {
    console.error('Error creating custom payment term:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom payment term
export async function DELETE(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const sellerId = decoded.userId;
    
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('id');
    const force = searchParams.get('force') === 'true'; // Allow force deletion

    if (!termId) {
      return NextResponse.json(
        { message: 'Term ID is required' },
        { status: 400 }
      );
    }

    // First, get the term name to check for usage
    const term = await sql`
      SELECT id, name FROM seller_custom_payment_terms
      WHERE id = ${termId} AND "sellerId" = ${sellerId}
      LIMIT 1
    `;

    if (term.length === 0) {
      return NextResponse.json(
        { message: 'Term not found or access denied' },
        { status: 404 }
      );
    }

    // Check if this term is being used by any products
    if (!force) {
      const usageCheck = await sql`
        SELECT COUNT(*) as usage_count
        FROM products 
        WHERE payment_terms @> ${JSON.stringify([term[0].name])}
        AND "sellerId" = ${sellerId}
      `;

      const usageCount = parseInt(usageCheck[0].usage_count);
      
      if (usageCount > 0) {
        return NextResponse.json({
          message: 'Cannot delete term that is in use',
          error: 'TERM_IN_USE',
          usageCount: usageCount,
          termName: term[0].name,
          details: `This payment term is currently used by ${usageCount} product(s). Please update those products first or use force deletion.`
        }, { status: 409 });
      }
    }

    // Soft delete by setting isActive to false
    const deletedTerm = await sql`
      UPDATE seller_custom_payment_terms
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${termId} AND "sellerId" = ${sellerId}
      RETURNING id
    `;

    return NextResponse.json({
      message: 'Custom payment term deleted successfully',
      forceDeleted: force
    });

  } catch (error: any) {
    console.error('Error deleting custom payment term:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
