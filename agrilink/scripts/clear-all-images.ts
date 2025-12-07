import { sql } from '../src/lib/db';

async function clearAllImageReferences() {
  try {
    console.log('🧹 Starting to clear all image references from database...');
    
    // Clear profile images
    console.log('📸 Clearing profile images...');
    const profileResult = await sql`
      UPDATE user_profiles 
      SET "profileImage" = NULL 
      WHERE "profileImage" IS NOT NULL
    `;
    console.log(`✅ Cleared ${profileResult.count} profile images`);
    
    // Clear storefront images
    console.log('🏪 Clearing storefront images...');
    const storefrontResult = await sql`
      UPDATE user_profiles 
      SET "storefrontImage" = NULL 
      WHERE "storefrontImage" IS NOT NULL
    `;
    console.log(`✅ Cleared ${storefrontResult.count} storefront images`);
    
    // Clear product images (check if column exists first)
    console.log('📦 Checking product images...');
    try {
      const productResult = await sql`
        UPDATE products 
        SET images = NULL 
        WHERE images IS NOT NULL
      `;
      console.log(`✅ Cleared ${productResult.count} product images`);
    } catch (error: any) {
      if (error.code === '42703') {
        console.log('ℹ️ Products table does not have images column - skipping');
      } else {
        throw error;
      }
    }
    
    // Clear verification documents (these might have S3 keys)
    console.log('📋 Clearing verification documents...');
    const verificationResult = await sql`
      UPDATE user_verification 
      SET "verificationDocuments" = NULL 
      WHERE "verificationDocuments" IS NOT NULL
    `;
    console.log(`✅ Cleared ${verificationResult.count} verification documents`);
    
    console.log('🎉 All image references cleared successfully!');
    console.log('📝 Users can now re-upload images to the new EU bucket');
    
  } catch (error) {
    console.error('❌ Error clearing image references:', error);
  } finally {
    process.exit(0);
  }
}

clearAllImageReferences();
