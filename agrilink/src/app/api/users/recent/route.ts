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
        id,
        name,
        email,
        "userType" as "user_type",
        "createdAt" as "created_at"
      FROM users 
      WHERE "userType" != 'admin'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;

    // Convert dates to ISO strings for JSON serialization
    const formattedUsers = recentUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString()
    }));

    return NextResponse.json(formattedUsers);

  } catch (error: any) {
    console.error('❌ Error fetching recent users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    );
  }
}
