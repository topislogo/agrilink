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
    console.log('📦 Applying business hours migration to storefront_details...');
    
    // Execute migration using tagged template
    await sql`
      ALTER TABLE "storefront_details" 
      ADD COLUMN IF NOT EXISTS "businessHours" text
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ businessHours column added to storefront_details table');
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️  Column may already exist, continuing...');
      console.log('✅ Migration check completed');
    } else {
      console.error('❌ Error applying migration:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

applyMigration();

