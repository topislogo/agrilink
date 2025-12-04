import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, current_database() as database_name`;
    
    console.log('✅ Database connection successful:', result[0]);
    
    // Test users table
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('👥 Total users in database:', userCount[0].count);
    
    // Test specific user lookup
    const testEmail = 'admin@agrilink.com'; // Change this to your email
    const user = await sql`SELECT id, email, name FROM users WHERE email = ${testEmail} LIMIT 1`;
    console.log('👤 Test user lookup:', user.length > 0 ? 'User found' : 'No user found', user[0] || '');
    
    return NextResponse.json({
      success: true,
      database: result[0],
      userCount: userCount[0].count,
      testUser: user[0] || null,
      message: 'Database connection test successful'
    });
    
  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
