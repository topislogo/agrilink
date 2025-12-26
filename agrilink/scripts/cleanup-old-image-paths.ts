/**
 * Script to clean up old local image paths from product_images table
 * Removes entries with old local file paths (like /products/xxx.jpeg)
 * These should be S3 keys (like products/xxx.jpeg without leading slash)
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function cleanupOldImagePaths() {
  try {
    console.log('🔍 Checking for old image paths in database...\n');
    
    // 1. Check product_images table
    // NOTE: Valid S3 keys are like "products/xxx.jpeg" (no leading slash)
    // Only delete paths that start with "/" (old local file paths)
    console.log('📦 Checking product_images table...');
    const productImages = await sql`
      SELECT id, "productId", "imageData"
      FROM product_images
      WHERE "imageData" LIKE '/products/%'
         OR "imageData" LIKE '/profiles/%'
         OR "imageData" LIKE '/storefronts/%'
         OR "imageData" LIKE '/api/%'
    `;
    
    console.log(`   Found ${productImages.length} old paths in product_images`);
    
    // 2. Check user_profiles table
    console.log('👤 Checking user_profiles table...');
    const profileImages = await sql`
      SELECT id, "userId", "profileImage", "storefrontImage"
      FROM user_profiles
      WHERE ("profileImage" LIKE '/profiles/%' OR "profileImage" LIKE '/products/%' OR "profileImage" LIKE '/storefronts/%')
         OR ("storefrontImage" LIKE '/profiles/%' OR "storefrontImage" LIKE '/products/%' OR "storefrontImage" LIKE '/storefronts/%')
    `;
    
    console.log(`   Found ${profileImages.length} old paths in user_profiles\n`);
    
    const totalOldPaths = productImages.length + profileImages.length;
    
    if (totalOldPaths === 0) {
      console.log('✅ No old image paths found. Database is clean!');
      return;
    }
    
    // Show some examples
    if (productImages.length > 0) {
      console.log('📋 Sample old paths in product_images:');
      productImages.slice(0, 3).forEach((path: any, index: number) => {
        console.log(`   ${index + 1}. ${path.imageData}`);
      });
    }
    
    if (profileImages.length > 0) {
      console.log('📋 Sample old paths in user_profiles:');
      profileImages.slice(0, 3).forEach((path: any, index: number) => {
        if (path.profileImage) console.log(`   ${index + 1}. profileImage: ${path.profileImage}`);
        if (path.storefrontImage) console.log(`   ${index + 1}. storefrontImage: ${path.storefrontImage}`);
      });
    }
    
    // Delete old image paths
    console.log('\n🗑️  Deleting old image paths...');
    
    if (productImages.length > 0) {
      const result1 = await sql`
        DELETE FROM product_images
        WHERE "imageData" LIKE '/products/%'
           OR "imageData" LIKE '/profiles/%'
           OR "imageData" LIKE '/storefronts/%'
           OR "imageData" LIKE '/api/%'
      `;
      console.log(`   ✅ Deleted ${productImages.length} entries from product_images`);
    }
    
    if (profileImages.length > 0) {
      const result2 = await sql`
        UPDATE user_profiles
        SET "profileImage" = NULL
        WHERE "profileImage" LIKE '/profiles/%'
           OR "profileImage" LIKE '/products/%'
           OR "profileImage" LIKE '/storefronts/%'
      `;
      
      const result3 = await sql`
        UPDATE user_profiles
        SET "storefrontImage" = NULL
        WHERE "storefrontImage" LIKE '/profiles/%'
           OR "storefrontImage" LIKE '/products/%'
           OR "storefrontImage" LIKE '/storefronts/%'
      `;
      console.log(`   ✅ Cleared ${profileImages.length} old paths from user_profiles`);
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${totalOldPaths} old image path entries`);
    
  } catch (error) {
    console.error('❌ Error cleaning up old image paths:', error);
    throw error;
  }
}

// Run the cleanup
cleanupOldImagePaths()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

