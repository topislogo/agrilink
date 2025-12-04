import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.email !== 'admin@agrilink.com') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const products = await sql`
      SELECT 
        p.id, p.name, p.category, p."isActive", p."createdAt",
        u.name as seller_name
      FROM products p
      LEFT JOIN users u ON p."sellerId" = u.id
      ORDER BY p."createdAt" DESC
    `;

    return NextResponse.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt.toISOString(),
        sellerName: product.seller_name,
      }))
    });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
