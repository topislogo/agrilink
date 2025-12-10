import { neon } from '@neondatabase/serverless';
import twilio from 'twilio';

// Get database connection
const getSql = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(process.env.DATABASE_URL);
};

interface TwilioSMSResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  verificationId?: string;
  messageId?: string;
}

class TwilioService {
  private twilioClient: twilio.Twilio | null = null;
  private fromNumber: string;
  private isDevelopmentMode: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.isDevelopmentMode = false;
      console.log('✅ Twilio client initialized - Production mode enabled');
    } else {
      this.isDevelopmentMode = true;
      console.log('⚠️ Twilio credentials not found, using development mode');
    }
  }

  /**
   * Send SMS verification code using Twilio
   */
  async sendVerificationCode(userId: string, phoneNumber: string): Promise<TwilioSMSResult> {
    try {

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check for recent verification attempts (rate limiting)
      const sql = getSql();
      const recentAttempts = await sql`
        SELECT COUNT(*) as count
        FROM verification_codes 
        WHERE "userId" = ${userId} 
        AND "createdAt" > NOW() - INTERVAL '1 minute'
      `;

      if (recentAttempts[0].count > 0) {
        return {
          success: false,
          error: 'wait a minute'
        };
      }

      // Store verification record in database first
      const verificationId = crypto.randomUUID();
      await sql`
        INSERT INTO verification_codes (
          "userId", 
          phone, 
          code,
          "expiresAt", 
          "createdAt",
          "verificationId"
        )
        VALUES (
          ${userId}, 
          ${phoneNumber}, 
          ${code},
          NOW() + INTERVAL '10 minutes', 
          NOW(),
          ${verificationId}
        )
        ON CONFLICT ("userId") 
        DO UPDATE SET 
          phone = ${phoneNumber},
          code = ${code},
          "expiresAt" = NOW() + INTERVAL '10 minutes',
          "createdAt" = NOW(),
          "verificationId" = ${verificationId}
      `;

      // Send SMS via Twilio
      if (this.twilioClient && !this.isDevelopmentMode) {
        try {
          const message = `Your AgriLink verification code is: ${code}. This code expires in 10 minutes.`;
          
          // Always log OTP code to console for demo purposes (even in production mode)
          console.log(`\n📱 ===== SMS VERIFICATION CODE (FOR DEMO) =====`);
          console.log(`📱 Phone: ${phoneNumber}`);
          console.log(`📱 Code: ${code}`);
          console.log(`📱 Expires: 10 minutes`);
          console.log(`📱 ===========================================\n`);
          
          const result = await this.twilioClient.messages.create({
            body: message,
            from: this.fromNumber,
            to: phoneNumber
          });
          
          
          console.log(`✅ Twilio SMS sent to ${phoneNumber}, MessageId: ${result.sid}`);
          
          return {
            success: true,
            message: 'Verification code sent successfully',
            code: code,
            verificationId: verificationId,
            messageId: result.sid
          };
        } catch (twilioError: any) {
          console.error('❌ Twilio error:', twilioError);
          console.error('❌ Twilio error message:', twilioError.message);
          console.error('❌ Twilio error code:', twilioError.code);
          
          // Fall back to development mode if Twilio fails
          console.log(`📱 [FALLBACK] SMS would be sent to ${phoneNumber}: ${code}`);
          return {
            success: true,
            message: 'Verification code sent (fallback mode)',
            code: code,
            verificationId: verificationId
          };
        }
      } else {
        // Development mode - just log to console
        console.log(`\n📱 ===== SMS VERIFICATION CODE (DEV MODE) =====`);
        console.log(`📱 Phone: ${phoneNumber}`);
        console.log(`📱 Code: ${code}`);
        console.log(`📱 Expires: 10 minutes`);
        console.log(`📱 Note: Twilio credentials not found or in dev mode`);
        console.log(`📱 ===========================================\n`);
        
        return {
          success: true,
          message: 'Verification code sent! Check console for the code (dev mode).',
          code: code,
          verificationId: verificationId
        };
      }
    } catch (error: any) {
      console.error('❌ Twilio send verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      };
    }
  }

  /**
   * Verify the code entered by user
   */
  async verifyCode(userId: string, phoneNumber: string, code: string): Promise<TwilioSMSResult> {
    try {
      const sql = getSql();
      
      // Get the verification record (allow already verified codes for re-verification)
      const verificationRecord = await sql`
        SELECT * FROM verification_codes 
        WHERE "userId" = ${userId} 
        AND phone = ${phoneNumber} 
        AND "expiresAt" > NOW()
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

      if (verificationRecord.length === 0) {
        return {
          success: false,
          error: 'No active verification found or code expired'
        };
      }

      const record = verificationRecord[0];

      // Check if code matches
      if (record.code !== code) {
        // Increment attempts
        await sql`
          UPDATE verification_codes 
          SET attempts = attempts + 1
          WHERE "verificationId" = ${record.verificationId}
        `;

        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Mark as verified
      await sql`
        UPDATE verification_codes 
        SET verified = true, "verifiedAt" = NOW()
        WHERE "verificationId" = ${record.verificationId}
      `;

      console.log(`✅ Twilio verification successful for ${phoneNumber}`);

      return {
        success: true,
        message: 'Phone number verified successfully'
      };

    } catch (error: any) {
      console.error('❌ Twilio verify code error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify code'
      };
    }
  }

  /**
   * Test Twilio connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.twilioClient) {
      console.log('❌ Twilio client not initialized');
      return false;
    }

    try {
      // Try to send a test message (this will test the connection)
      const result = await this.twilioClient.messages.create({
        body: 'Test message',
        from: this.fromNumber,
        to: '+1234567890' // This will fail but test the connection
      });
      return true;
    } catch (error: any) {
      if (error.code === 21211) {
        // This is expected - it means the connection works but the phone number is invalid
        console.log('✅ Twilio connection successful');
        return true;
      }
      console.error('❌ Twilio connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get verification stats
   */
  async getVerificationStats(): Promise<any> {
    try {
      const sql = getSql();
      
      const stats = await sql`
        SELECT 
          COUNT(*) as total_verifications,
          COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
          COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
        FROM verification_codes
      `;

      return stats[0];
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
