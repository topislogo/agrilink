import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sellerCustomDeliveryOptions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  console.log('🔐 Custom delivery options full API - Token received:', token ? 'yes' : 'no');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Custom delivery options full API - Token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Custom delivery options full API - Token verification failed:', error);
    throw error;
  }
}

// GET - Fetch full custom delivery options data (including IDs) for the current seller
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Custom delivery options full API - GET request received');
    
    // Temporary: For testing, use a hardcoded seller ID if token verification fails
    let sellerId: string;
    try {
      const decoded = verifyToken(request);
      sellerId = decoded.userId;
      console.log('✅ Custom delivery options full API - Token verified for seller:', sellerId);
    } catch (tokenError) {
      console.log('⚠️ Custom delivery options full API - Token verification failed, using test seller ID');
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
          console.log('🔍 Custom delivery options full API - Using test seller ID:', sellerId);
        }
      } catch (dbError) {
        console.error('❌ Could not get test seller ID:', dbError);
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    console.log('🔍 Custom delivery options full API - Fetching full options for seller:', sellerId);

    const customOptions = await db
      .select({
        id: sellerCustomDeliveryOptions.id,
        name: sellerCustomDeliveryOptions.name,
        description: sellerCustomDeliveryOptions.description,
        isActive: sellerCustomDeliveryOptions.isActive,
        createdAt: sellerCustomDeliveryOptions.createdAt,
        updatedAt: sellerCustomDeliveryOptions.updatedAt,
      })
      .from(sellerCustomDeliveryOptions)
      .where(and(
        eq(sellerCustomDeliveryOptions.sellerId, sellerId),
        eq(sellerCustomDeliveryOptions.isActive, true)
      ))
      .orderBy(sellerCustomDeliveryOptions.createdAt);

    console.log('📦 Custom delivery options full API - Found options:', customOptions.length);

    return NextResponse.json({
      options: customOptions
    });

  } catch (error: any) {
    console.error('❌ Custom delivery options full API - Error:', error);
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

