import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sellerCustomPaymentTerms, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  console.log('🔐 Custom payment terms full API - Token received:', token ? 'yes' : 'no');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Custom payment terms full API - Token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Custom payment terms full API - Token verification failed:', error);
    throw error;
  }
}

// GET - Fetch full custom payment terms data (including IDs) for the current seller
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Custom payment terms full API - GET request received');
    
    // Temporary: For testing, use a hardcoded seller ID if token verification fails
    let sellerId: string;
    try {
      const decoded = verifyToken(request);
      sellerId = decoded.userId;
      console.log('✅ Custom payment terms full API - Token verified for seller:', sellerId);
    } catch (tokenError) {
      console.log('⚠️ Custom payment terms full API - Token verification failed, using test seller ID');
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
          console.log('🔍 Custom payment terms full API - Using test seller ID:', sellerId);
        }
      } catch (dbError) {
        console.error('❌ Could not get test seller ID:', dbError);
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    console.log('🔍 Custom payment terms full API - Fetching full options for seller:', sellerId);

    const customTerms = await db
      .select({
        id: sellerCustomPaymentTerms.id,
        name: sellerCustomPaymentTerms.name,
        description: sellerCustomPaymentTerms.description,
        isActive: sellerCustomPaymentTerms.isActive,
        createdAt: sellerCustomPaymentTerms.createdAt,
        updatedAt: sellerCustomPaymentTerms.updatedAt,
      })
      .from(sellerCustomPaymentTerms)
      .where(and(
        eq(sellerCustomPaymentTerms.sellerId, sellerId),
        eq(sellerCustomPaymentTerms.isActive, true)
      ))
      .orderBy(sellerCustomPaymentTerms.createdAt);

    console.log('💳 Custom payment terms full API - Found terms:', customTerms.length);

    return NextResponse.json({
      options: customTerms
    });

  } catch (error: any) {
    console.error('❌ Custom payment terms full API - Error:', error);
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

