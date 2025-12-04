import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { isNotNull } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Simple S3 check...');

    // Get a few users with images
    const usersWithImages = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        profileImage: users.profileImage,
        storefrontImage: users.storefrontImage,
      })
      .from(users)
      .where(isNotNull(users.profileImage))
      .limit(5);

    console.log('Users with images:', usersWithImages);

    return NextResponse.json({
      success: true,
      count: usersWithImages.length,
      users: usersWithImages
    });

  } catch (error) {
    console.error('❌ Error in simple S3 check:', error);
    return NextResponse.json({ 
      error: 'Failed to check S3 mapping',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
