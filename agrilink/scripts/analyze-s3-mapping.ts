import { sql } from '../src/lib/db/db';

async function analyzeS3Mapping() {
  console.log('🔍 Analyzing S3 key mapping in database...\n');

  try {
    // 1. Check users table for profile and storefront images
    console.log('👤 USER PROFILE & STOREFRONT IMAGES:');
    console.log('=====================================');
    
    const users = await sql`
      SELECT 
        id, 
        email, 
        name, 
        "profileImage", 
        "storefrontImage",
        "userType",
        "accountType"
      FROM users 
      WHERE "profileImage" IS NOT NULL OR "storefrontImage" IS NOT NULL
      ORDER BY "createdAt" DESC
    `;

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   User Type: ${user.userType} | Account: ${user.accountType}`);
      console.log(`   Profile Image: ${user.profileImage || 'None'}`);
      console.log(`   Storefront Image: ${user.storefrontImage || 'None'}`);
    });

    // 2. Check products table for product images
    console.log('\n\n📦 PRODUCT IMAGES:');
    console.log('==================');
    
    const products = await sql`
      SELECT 
        id, 
        name, 
        "imageUrl",
        "sellerId"
      FROM products 
      WHERE "imageUrl" IS NOT NULL
      ORDER BY "createdAt" DESC
    `;

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Seller ID: ${product.sellerId}`);
      console.log(`   Image URL: ${product.imageUrl}`);
    });

    // 3. Check verification documents
    console.log('\n\n📄 VERIFICATION DOCUMENTS:');
    console.log('==========================');
    
    const verifications = await sql`
      SELECT 
        "userId",
        "verificationDocuments",
        "verificationStatus"
      FROM user_verification 
      WHERE "verificationDocuments" IS NOT NULL
      ORDER BY "createdAt" DESC
    `;

    verifications.forEach((verification, index) => {
      console.log(`\n${index + 1}. User ID: ${verification.userId}`);
      console.log(`   Status: ${verification.verificationStatus}`);
      console.log(`   Documents: ${JSON.stringify(verification.verificationDocuments, null, 2)}`);
    });

    // 4. Summary statistics
    console.log('\n\n📊 SUMMARY:');
    console.log('===========');
    
    const totalUsers = users.length;
    const usersWithProfileImages = users.filter(u => u.profileImage).length;
    const usersWithStorefrontImages = users.filter(u => u.storefrontImage).length;
    const totalProducts = products.length;
    const totalVerifications = verifications.length;

    console.log(`Total users with images: ${totalUsers}`);
    console.log(`Users with profile images: ${usersWithProfileImages}`);
    console.log(`Users with storefront images: ${usersWithStorefrontImages}`);
    console.log(`Total products with images: ${totalProducts}`);
    console.log(`Total verification documents: ${totalVerifications}`);

    // 5. Check for bucket references
    console.log('\n\n🪣 BUCKET ANALYSIS:');
    console.log('==================');
    
    const euBucketReferences = await sql`
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
    `;

    if (euBucketReferences.length > 0) {
      console.log(`❌ Found ${euBucketReferences.length} references to old EU bucket:`);
      euBucketReferences.forEach((ref, index) => {
        console.log(`   ${index + 1}. ${ref.table_name} - ${ref.email} - ${ref.image_field}: ${ref.image_value}`);
      });
    } else {
      console.log('✅ No references to old EU bucket found');
    }

    const newBucketReferences = await sql`
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
    `;

    if (newBucketReferences.length > 0) {
      console.log(`\n✅ Found ${newBucketReferences.length} references to new bucket:`);
      newBucketReferences.forEach((ref, index) => {
        console.log(`   ${index + 1}. ${ref.table_name} - ${ref.email} - ${ref.image_field}: ${ref.image_value}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing S3 mapping:', error);
  }
}

// Run analysis
analyzeS3Mapping().then(() => {
  console.log('\n🎉 Analysis completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
});
