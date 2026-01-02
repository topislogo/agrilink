import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getNeonSql } from '../src/lib/db/connection-helper';

dotenv.config({ path: '.env.local' }); // Load environment variables

const sql = getNeonSql();

async function applyMigration() {
  try {
    console.log('🔄 Applying migration: Add maintenance_schedules table...\n');

    const migrationPath = path.join(
      __dirname,
      '../src/lib/db/drizzle/migrations/0011_add_maintenance_schedules.sql'
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
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        await sql.query(statement);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📋 Created maintenance_schedules table with:');
    console.log('   - id (uuid, primary key)');
    console.log('   - startTime (timestamp with timezone)');
    console.log('   - endTime (timestamp with timezone)');
    console.log('   - duration (integer, minutes)');
    console.log('   - message (text, optional)');
    console.log('   - isActive (boolean, default true)');
    console.log('   - createdAt, updatedAt (timestamps)');
    console.log('\n📊 Created indexes for efficient queries');
    console.log('\n✅ Maintenance notification system is now ready!');
    console.log('   Admin can schedule maintenance at /admin/maintenance');
    console.log('   Users will see banner 24 hours before scheduled maintenance');
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  }
}

applyMigration();

