import dotenv from 'dotenv';
import { sql } from '@/lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function addNotificationsTable() {
  try {
    console.log('🔄 Adding notifications table...');
    
    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'in-app',
        read BOOLEAN NOT NULL DEFAULT false,
        link TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('✅ Notifications table created successfully');
    
    // Create index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");
    `;

    console.log('✅ Indexes created successfully');
    
    // Test the table by inserting a sample notification
    const testUserId = '72c8f83d-1496-48f4-ab23-40be1aa8284d'; // Aung Min's ID
    await sql`
      INSERT INTO notifications ("userId", title, body, type, read, link)
      VALUES (
        ${testUserId},
        '🎉 Welcome to AgriLink!',
        'Your notification system is now active. You will receive updates about your offers here.',
        'in-app',
        false,
        '/dashboard'
      );
    `;

    console.log('✅ Test notification inserted successfully');
    console.log('🎉 Notifications table setup complete!');

  } catch (error) {
    console.error('❌ Error adding notifications table:', error);
  } finally {
    process.exit(0);
  }
}

addNotificationsTable();
