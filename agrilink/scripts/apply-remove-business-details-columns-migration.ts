import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DEV) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL!;
const sql = neon(databaseUrl);

async function applyMigration() {
  try {
    console.log('📦 Removing businessHours, specialties, and policies columns from business_details...');
    
    // Execute migration using tagged template
    await sql`
      ALTER TABLE "business_details" 
      DROP COLUMN IF EXISTS "businessHours",
      DROP COLUMN IF EXISTS "specialties",
      DROP COLUMN IF EXISTS "policies"
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Removed businessHours, specialties, and policies columns from business_details table');
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('column')) {
      console.log('⚠️  Column(s) may already be removed, continuing...');
      console.log('✅ Migration check completed');
    } else {
      console.error('❌ Error applying migration:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

applyMigration();

