import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Admin Products API: No authorization header');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError) {
      console.error('❌ Admin Products API: JWT verification failed:', jwtError);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    console.log('🔍 Admin Products API: User ID:', decoded.userId, 'Email:', decoded.email);
    
    // Check if user is admin (check userType in database, more flexible than email check)
    const adminUserResult = await sql`
      SELECT id, email, "userType" 
      FROM users 
      WHERE id = ${decoded.userId} AND "userType" = 'admin'
    `;

    // Handle Neon response format (can be array or object)
    const adminUserArray = Array.isArray(adminUserResult) ? adminUserResult : (adminUserResult ? [adminUserResult] : []);
    const adminUser = adminUserArray[0];
    if (!adminUser) {
      console.log('❌ Admin Products API: Not admin user. User ID:', decoded.userId);
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    console.log('✅ Admin Products API: Admin verified:', adminUser.email);

    console.log('✅ Admin Products API: Fetching products from database...');
    let productsResult;
    try {
      // Use a simpler query first to test
      productsResult = await sql`
        SELECT 
          p.id, 
          p.name, 
          p."isActive", 
          p."createdAt",
          COALESCE(u.name, 'Unknown') as seller_name,
          COALESCE(c.name, 'Uncategorized') as category_name
        FROM products p
        LEFT JOIN users u ON p."sellerId" = u.id
        LEFT JOIN categories c ON p."categoryId" = c.id
        ORDER BY p."createdAt" DESC
      `;
      
      // Handle Neon response format (can be array or object)
      const productsArray = Array.isArray(productsResult) 
        ? productsResult 
        : (productsResult ? [productsResult] : []);
      
      console.log('✅ Admin Products API: Query executed successfully, rows:', productsArray.length);
      console.log('📦 Admin Products API: Found products:', productsArray.length);

      const mappedProducts = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category_name || 'Uncategorized',
        isActive: product.isActive,
        createdAt: product.createdAt instanceof Date 
          ? product.createdAt.toISOString() 
          : new Date(product.createdAt).toISOString(),
        sellerName: product.seller_name || 'Unknown',
      }));

      console.log('✅ Admin Products API: Returning', mappedProducts.length, 'products');
      return NextResponse.json({
        products: mappedProducts
      });
    } catch (queryError: any) {
      console.error('❌ Admin Products API: SQL Query Error:', queryError);
      console.error('❌ Query Error Details:', {
        message: queryError.message,
        code: queryError.code,
        detail: queryError.detail,
        hint: queryError.hint,
        stack: queryError.stack
      });
      return NextResponse.json({ 
        message: 'Database query error',
        error: queryError.message,
        detail: queryError.detail,
        hint: queryError.hint
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Admin Products API Error:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'No error message',
      stack: error?.stack || 'No stack trace',
      code: error?.code || 'No error code',
      detail: error?.detail || 'No detail',
      hint: error?.hint || 'No hint',
      name: error?.name || 'Unknown error type'
    });
    
    // Ensure we always return a valid JSON response
    const errorMessage = error?.message || 'Unknown error occurred';
    const errorDetail = error?.detail || null;
    
    return NextResponse.json({ 
      message: 'Internal server error',
      error: errorMessage,
      detail: errorDetail,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error?.stack,
        code: error?.code,
        hint: error?.hint
      })
    }, { status: 500 });
  }
}
