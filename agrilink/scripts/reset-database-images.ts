import { db } from '../src/lib/db';
import { userProfiles } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetDatabaseImages() {
  try {
    console.log('🧹 Resetting database image references...');
    
    // Get all user profiles
    const profiles = await db.select().from(userProfiles);
    
    console.log(`📊 Found ${profiles.length} user profiles`);
    
    let updatedCount = 0;
    
    // Reset all profile and storefront images to null
    for (const profile of profiles) {
      if (profile.profileImage || profile.storefrontImage) {
        console.log(`🔄 Resetting images for user: ${profile.userId}`);
        console.log(`  - Profile: ${profile.profileImage || 'null'}`);
        console.log(`  - Storefront: ${profile.storefrontImage || 'null'}`);
        
        await db
          .update(userProfiles)
          .set({
            profileImage: null,
            storefrontImage: null,
          })
          .where(eq(userProfiles.userId, profile.userId));
        
        updatedCount++;
        console.log(`✅ Reset images for user: ${profile.userId}`);
      }
    }
    
    console.log(`\n🎉 Database reset completed!`);
    console.log(`✅ Updated ${updatedCount} user profiles`);
    console.log(`📝 All image references set to null`);
    console.log(`\n💡 Users can now upload fresh images without conflicts`);
    
  } catch (error) {
    console.error('❌ Error resetting database images:', error);
  }
}

resetDatabaseImages();
