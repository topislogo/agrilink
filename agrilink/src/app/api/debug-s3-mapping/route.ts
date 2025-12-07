import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, userVerification } from '@/lib/db/schema';
import { sql, like, isNotNull, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Analyzing S3 key mapping in database...');

    // 1. Check users table for profile and storefront images
    const usersWithImages = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        profileImage: users.profileImage,
        storefrontImage: users.storefrontImage,
        userType: users.userType,
        accountType: users.accountType
      })
      .from(users)
      .where(
        or(
          isNotNull(users.profileImage),
          isNotNull(users.storefrontImage)
        )
      )
      .limit(20);

    // 2. Check products table for product images
    const productsWithImages = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        sellerId: products.sellerId
      })
      .from(products)
      .where(isNotNull(products.imageUrl))
      .limit(20);

    // 3. Check verification documents
    const verificationsWithDocs = await db
      .select({
        userId: userVerification.userId,
        verificationDocuments: userVerification.verificationDocuments,
        verificationStatus: userVerification.verificationStatus
      })
      .from(userVerification)
      .where(isNotNull(userVerification.verificationDocuments))
      .limit(10);

    // 4. Check for bucket references using raw SQL for complex LIKE queries
    const euBucketReferences = await db.execute(sql`
      SELECT 
        'users' as table_name,
        id,
        email,
        "profileImage" as image_field,
        "profileImage" as image_value
      FROM users 
      WHERE "profileImage" LIKE 'agrilink-bucket-eu%'
      
      UNION ALL
      
      SELECT 
        'users' as table_name,
        id,
        email,
        'storefrontImage' as image_field,
        "storefrontImage" as image_value
      FROM users 
      WHERE "storefrontImage" LIKE 'agrilink-bucket-eu%'
      
      UNION ALL
      
      SELECT 
        'products' as table_name,
        id,
        name as email,
        'imageUrl' as image_field,
        "imageUrl" as image_value
      FROM products 
      WHERE "imageUrl" LIKE 'agrilink-bucket-eu%'
    `);

    const newBucketReferences = await db.execute(sql`
      SELECT 
        'users' as table_name,
        id,
        email,
        "profileImage" as image_field,
        "profileImage" as image_value
      FROM users 
      WHERE "profileImage" LIKE 'agrilink-bucket-343218206997%'
      
      UNION ALL
      
      SELECT 
        'users' as table_name,
        id,
        email,
        'storefrontImage' as image_field,
        "storefrontImage" as image_value
      FROM users 
      WHERE "storefrontImage" LIKE 'agrilink-bucket-343218206997%'
      
      UNION ALL
      
      SELECT 
        'products' as table_name,
        id,
        name as email,
        'imageUrl' as image_field,
        "imageUrl" as image_value
      FROM products 
      WHERE "imageUrl" LIKE 'agrilink-bucket-343218206997%'
    `);

    const analysis = {
      summary: {
        totalUsers: usersWithImages.length,
        usersWithProfileImages: usersWithImages.filter(u => u.profileImage).length,
        usersWithStorefrontImages: usersWithImages.filter(u => u.storefrontImage).length,
        totalProducts: productsWithImages.length,
        totalVerifications: verificationsWithDocs.length,
        euBucketReferences: euBucketReferences.rows.length,
        newBucketReferences: newBucketReferences.rows.length
      },
      users: usersWithImages.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        accountType: user.accountType,
        profileImage: user.profileImage,
        storefrontImage: user.storefrontImage
      })),
      products: productsWithImages.map(product => ({
        id: product.id,
        name: product.name,
        sellerId: product.sellerId,
        imageUrl: product.imageUrl
      })),
      verifications: verificationsWithDocs.map(verification => ({
        userId: verification.userId,
        verificationStatus: verification.verificationStatus,
        verificationDocuments: verification.verificationDocuments
      })),
      euBucketReferences: euBucketReferences.rows.map((ref: any) => ({
        table: ref.table_name,
        id: ref.id,
        email: ref.email,
        field: ref.image_field,
        value: ref.image_value
      })),
      newBucketReferences: newBucketReferences.rows.map((ref: any) => ({
        table: ref.table_name,
        id: ref.id,
        email: ref.email,
        field: ref.image_field,
        value: ref.image_value
      }))
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('❌ Error analyzing S3 mapping:', error);
    return NextResponse.json({ error: 'Failed to analyze S3 mapping' }, { status: 500 });
  }
}
