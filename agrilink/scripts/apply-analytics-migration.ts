import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables

const sql = neon(process.env.DATABASE_URL!);

async function applyMigration() {
  try {
    console.log('🔄 Applying migration: Add analytics_events table...\n');

    const migrationPath = path.join(
      __dirname,
      '../src/lib/db/drizzle/migrations/0010_add_analytics_events.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements and execute them separately
    // Remove comments and split by semicolon
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        await sql.query(statement);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📋 Created analytics_events table with:');
    console.log('   - eventType (profile_view, product_view)');
    console.log('   - targetId (sellerId or productId)');
    console.log('   - viewerId (optional, for authenticated users)');
    console.log('   - metadata (JSON for additional data)');
    console.log('   - createdAt (timestamp)');
    console.log('\n✅ Analytics tracking is now ready!');
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  }
}

applyMigration();

