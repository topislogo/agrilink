import { sql } from '../src/lib/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetUserVerification() {
  try {
    console.log('🔄 Starting verification status reset for traderbiz2@gmail.com...');
    
    // First, find the user ID
    const [user] = await sql`
      SELECT id, email, name FROM users WHERE email = 'traderbiz2@gmail.com'
    `;
    
    if (!user) {
      console.log('❌ User traderbiz2@gmail.com not found');
      return;
    }
    
    console.log('👤 Found user:', { id: user.id, email: user.email, name: user.name });
    
    // Reset verification status to just phone and ID verified
    await sql`
      UPDATE user_verification 
      SET 
        verified = false,
        "phoneVerified" = true,
        "verificationStatus" = 'pending',
        "verificationDocuments" = jsonb_build_object(
          'idCard', jsonb_build_object(
            'status', 'verified',
            'name', 'ID Card Document',
            'data', 'profiles/placeholder-id.jpg',
            'uploadedAt', NOW()
          )
        ),
        "rejectedDocuments" = null,
        "verificationSubmitted" = false,
        "businessDetailsCompleted" = false,
        "updatedAt" = NOW()
      WHERE "userId" = ${user.id}
    `;
    
    console.log('✅ Verification status reset completed');
    console.log('📋 New status: Phone verified, ID verified, not fully verified');
    
    // Verify the update
    const [updatedUser] = await sql`
      SELECT 
        verified,
        "phoneVerified", 
        "verificationStatus",
        "verificationDocuments",
        "rejectedDocuments",
        "verificationSubmitted"
      FROM user_verification 
      WHERE "userId" = ${user.id}
    `;
    
    console.log('🔍 Updated verification data:', updatedUser);
    
  } catch (error) {
    console.error('❌ Error resetting verification status:', error);
  } finally {
    process.exit(0);
  }
}

resetUserVerification();
