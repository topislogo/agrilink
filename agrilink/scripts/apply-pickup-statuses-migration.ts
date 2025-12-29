import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_DEV;
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL or DATABASE_URL_DEV environment variable is not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function applyMigration() {
  try {
    console.log('🔄 Applying migration: Add pickup statuses to offers_status_check constraint...\n');

    // Execute the migration SQL directly
    console.log('Dropping existing constraint...');
    await sql`ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_status_check;`;
    
    console.log('Adding updated constraint with pickup statuses...');
    await sql`
      ALTER TABLE offers ADD CONSTRAINT offers_status_check 
      CHECK (status IN ('pending', 'accepted', 'rejected', 'to_ship', 'shipped', 'delivered', 'received', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled', 'expired'))
    `;

    console.log('✅ Migration applied successfully!');
    console.log('\n📋 Updated constraint now includes:');
    console.log('   - ready_for_pickup');
    console.log('   - picked_up');
    console.log('\n✅ Pickup order statuses are now allowed in the database!');
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  }
}

applyMigration();

