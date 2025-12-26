import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { offerComplaints } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return user;
  } catch (error: any) {
    return null;
  }
}

// GET /api/admin/complaints - Get all complaints for admin review
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get complaints with related offer and user information
    let query = sql`
      SELECT 
        c.id,
        c."offerId",
        c."raisedBy",
        c."reportedUserId",
        c."complaintType",
        c.reason,
        c.status,
        c."createdAt",
        o."buyerId",
        o."sellerId",
        o.status as "offerStatus",
        o."cancellationReason",
        p.name as "productName",
        p.id as "productId",
        buyer.name as "buyerName",
        buyer.email as "buyerEmail",
        seller.name as "sellerName",
        seller.email as "sellerEmail"
      FROM offer_complaints c
      INNER JOIN offers o ON c."offerId" = o.id
      INNER JOIN products p ON o."productId" = p.id
      INNER JOIN users buyer ON c."raisedBy" = buyer.id
      INNER JOIN users seller ON c."reportedUserId" = seller.id
    `;

    const conditions = [];
    if (status) {
      conditions.push(sql`c.status = ${status}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY c."createdAt" DESC`;

    const complaints = await query;

    // Get statistics
    const statsResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) as total
      FROM offer_complaints
    `;

    const stats = statsResult[0] || { submitted: 0, total: 0 };

    return NextResponse.json({
      complaints: complaints.map((c: any) => ({
        id: c.id,
        offerId: c.offerId,
        complaintType: c.complaintType,
        reason: c.reason,
        status: c.status,
        createdAt: c.createdAt,
        offer: {
          id: c.offerId,
          status: c.offerStatus,
          cancellationReason: c.cancellationReason
        },
        product: {
          id: c.productId,
          name: c.productName
        },
        buyer: {
          id: c.raisedBy,
          name: c.buyerName,
          email: c.buyerEmail
        },
        seller: {
          id: c.reportedUserId,
          name: c.sellerName,
          email: c.sellerEmail
        }
      })),
      statistics: {
        submitted: Number(stats.submitted) || 0,
        total: Number(stats.total) || 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

