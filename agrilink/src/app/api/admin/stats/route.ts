import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
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

    // Get all stats in parallel
    const [
      usersResult,
      productsResult,
      conversationsResult,
      messagesResult,
      verifiedUsersResult,
      pendingVerificationsResult
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COUNT(*) as count FROM conversations`,
      sql`SELECT COUNT(*) as count FROM messages`,
      sql`SELECT COUNT(*) as count FROM user_verification WHERE verified = true`,
      sql`SELECT COUNT(*) as count FROM verification_requests`
    ]);

    return NextResponse.json({
      totalUsers: parseInt(usersResult[0].count),
      totalProducts: parseInt(productsResult[0].count),
      totalConversations: parseInt(conversationsResult[0].count),
      totalMessages: parseInt(messagesResult[0].count),
      verifiedUsers: parseInt(verifiedUsersResult[0].count),
      pendingVerifications: parseInt(pendingVerificationsResult[0].count),
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
