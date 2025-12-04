import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

    // Get comprehensive user statistics
    const [
      totalUsers,
      userTypeStats,
      verificationStats,
      recentUsers,
      businessUsers
    ] = await Promise.all([
      // Total users (excluding admin)
      sql`SELECT COUNT(*) as count FROM users WHERE "userType" != 'admin'`,
      
      // User type breakdown
      sql`
        SELECT "userType", COUNT(*) as count
        FROM users 
        WHERE "userType" != 'admin'
        GROUP BY "userType"
      `,
      
      // Verification status breakdown
      sql`
        SELECT 
          uv."verificationStatus",
          COUNT(*) as count
        FROM user_verification uv
        JOIN users u ON uv."userId" = u.id
        WHERE u."userType" != 'admin'
        GROUP BY uv."verificationStatus"
      `,
      
      // Recent users (last 7 days)
      sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE "userType" != 'admin' 
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      `,
      
      // Business users with completed details
      sql`
        SELECT COUNT(*) as count
        FROM users u
        JOIN user_verification uv ON u.id = uv."userId"
        WHERE u."userType" != 'admin' 
        AND u."accountType" = 'business'
        AND uv."businessDetailsCompleted" = true
      `
    ]);

    // Get verification requests count
    const [verificationRequests] = await sql`
      SELECT COUNT(*) as count
      FROM verification_requests
    `;

    // Get products count
    const [productsCount] = await sql`
      SELECT COUNT(*) as count
      FROM products
    `;

    // Get offers count
    const [offersCount] = await sql`
      SELECT COUNT(*) as count
      FROM offers
    `;

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalUsers: parseInt(totalUsers[0].count),
        recentUsers: parseInt(recentUsers[0].count),
        businessUsers: parseInt(businessUsers[0].count),
        verificationRequests: parseInt(verificationRequests.count),
        products: parseInt(productsCount.count),
        offers: parseInt(offersCount.count),
        userTypes: userTypeStats.map((stat: any) => ({
          type: stat.userType,
          count: parseInt(stat.count)
        })),
        verificationStatus: verificationStats.map((stat: any) => ({
          status: stat.verificationStatus || 'not_started',
          count: parseInt(stat.count)
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
