import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function checkOrCreateAdmin() {
  try {
    console.log('🔍 Checking for admin account...\n');

    const adminEmail = 'admin@agrilink.com';
    
    // Check if admin exists
    const existingAdmin = await sql`
      SELECT id, email, name, "userType" 
      FROM users 
      WHERE email = ${adminEmail}
    `;

    const adminArray = Array.isArray(existingAdmin) ? existingAdmin : (existingAdmin ? [existingAdmin] : []);
    
    if (adminArray.length > 0) {
      const admin = adminArray[0];
      console.log('✅ Admin account found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   User Type: ${admin.userType}`);
      console.log('\n✅ Admin account exists and is ready to use!');
      return;
    }

    // Admin doesn't exist, create it
    console.log('❌ Admin account not found. Creating new admin account...\n');
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    const adminId = crypto.randomUUID();
    const adminName = 'AgriLink Admin';
    
    // Insert admin user
    await sql`
      INSERT INTO users (id, email, name, "passwordHash", "userType", "accountType", "emailVerified", "createdAt", "updatedAt")
      VALUES (
        ${adminId},
        ${adminEmail},
        ${adminName},
        ${passwordHash},
        'admin',
        'individual',
        true,
        NOW(),
        NOW()
      )
    `;

    // Create user profile
    await sql`
      INSERT INTO user_profiles ("userId", "createdAt", "updatedAt")
      VALUES (${adminId}, NOW(), NOW())
    `;

    // Create user verification record
    await sql`
      INSERT INTO user_verification ("userId", verified, "phoneVerified", "verificationStatus", "createdAt", "updatedAt")
      VALUES (${adminId}, true, false, 'verified', NOW(), NOW())
    `;

    // Create user ratings record
    await sql`
      INSERT INTO user_ratings ("userId", rating, "totalReviews", "createdAt", "updatedAt")
      VALUES (${adminId}, 0, 0, NOW(), NOW())
    `;

    console.log('✅ Admin account created successfully!');
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('   You can set ADMIN_PASSWORD in .env.local to use a custom password.\n');

  } catch (error: any) {
    console.error('❌ Error checking/creating admin account:', error);
    console.error('   Message:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  }
}

checkOrCreateAdmin();

