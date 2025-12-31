import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    const [adminUser] = await sql`
      SELECT id, email, "userType" 
      FROM users 
      WHERE id = ${decoded.userId} AND "userType" = 'admin'
    `;

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch recent users (excluding admins)
    const recentUsers = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u."isRestricted",
        u."userType" as user_type,
        u."createdAt" as created_at,
        COUNT(r.id) FILTER (WHERE r.status = 'pending') AS pendingReports
      FROM users u
      LEFT JOIN user_reports r ON r."reportedId" = u.id
      WHERE u."userType" != 'admin'
      GROUP BY u.id
      ORDER BY COUNT(r.id) FILTER (WHERE r.status = 'pending') DESC, u."createdAt" DESC
    `;

    // Convert dates to ISO strings for JSON serialization
    const formattedUsers = recentUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isRestricted: user.isRestricted,
      user_type: user.user_type,
      pendingReports: Number(user.pendingreports ?? 0),
      created_at: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString()
    }));
    

    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM user_reports) AS total,
        (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') AS pending,
        (SELECT COUNT(*) FROM users WHERE "isRestricted" = true) AS restrictedUsers
    `;

    const formattedStatistics = {
      total: Number(stats.total),
      pending: Number(stats.pending),
      restrictedUsers: Number(stats.restrictedusers)
    };

    return NextResponse.json({users: formattedUsers, statistics: formattedStatistics});

  } catch (error: any) {
    console.error('❌ Error fetching recent users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    );
  }
}