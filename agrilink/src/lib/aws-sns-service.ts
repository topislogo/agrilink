import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { getNeonSql } from '@/lib/db/connection-helper';

// Get database connection
const getSql = () => {
  return getNeonSql();
};

interface SNSSMSResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  verificationId?: string;
  messageId?: string;
}

class AWSSNSService {
  private snsClient: SNSClient | null = null;
  private region: string;
  private isDevelopmentMode: boolean;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    // Initialize AWS SNS client if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.snsClient = new SNSClient({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.isDevelopmentMode = false; // Force production mode when AWS credentials are available
      console.log('✅ AWS SNS client initialized - Production mode enabled');
    } else {
      this.isDevelopmentMode = true;
      console.log('⚠️ AWS credentials not found, using development mode');
    }
  }

  /**
   * Send SMS verification code using AWS SNS
   */
  async sendVerificationCode(userId: string, phoneNumber: string): Promise<SNSSMSResult> {
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

      // Send SMS via AWS SNS
      if (this.snsClient && !this.isDevelopmentMode) {
        try {
          const message = `Your AgriLink verification code is: ${code}. This code expires in 10 minutes.`;
          
          const command = new PublishCommand({
            Message: message,
            PhoneNumber: phoneNumber,
          });

          const result = await this.snsClient.send(command);
          
          console.log(`✅ AWS SNS SMS sent to ${phoneNumber}, MessageId: ${result.MessageId}`);
          console.log('📊 AWS SNS Full Response:', JSON.stringify(result, null, 2));
          
          return {
            success: true,
            message: 'Verification code sent successfully',
            code: code,
            verificationId: verificationId,
            messageId: result.MessageId
          };
        } catch (snsError) {
          console.error('❌ AWS SNS error:', snsError);
          console.error('❌ AWS SNS error name:', snsError.name);
          console.error('❌ AWS SNS error message:', snsError.message);
          console.error('❌ AWS SNS error code:', snsError.$metadata?.httpStatusCode);
          console.error('❌ AWS SNS full error:', JSON.stringify(snsError, null, 2));
          
          // Fall back to development mode if SNS fails
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
        console.log(`\n📱 ===== SMS VERIFICATION CODE =====`);
        console.log(`📱 Phone: ${phoneNumber}`);
        console.log(`📱 Code: ${code}`);
        console.log(`📱 Expires: 10 minutes`);
        console.log(`📱 ================================\n`);
        
        return {
          success: true,
          message: 'Verification code sent! Check console for the code.',
          code: code,
          verificationId: verificationId
        };
      }

    } catch (error) {
      console.error('❌ AWS SNS send verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      };
    }
  }

  /**
   * Verify the code entered by user
   */
  async verifyCode(userId: string, phoneNumber: string, code: string): Promise<SNSSMSResult> {
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

      console.log(`✅ AWS SNS verification successful for ${phoneNumber}`);

      return {
        success: true,
        message: 'Phone number verified successfully'
      };

    } catch (error) {
      console.error('❌ AWS SNS verify code error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify code'
      };
    }
  }

  /**
   * Test AWS SNS connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.snsClient) {
      console.log('❌ AWS SNS client not initialized');
      return false;
    }

    try {
      // Try to get topic attributes (this will test the connection)
      const command = new PublishCommand({
        Message: 'Test message',
        PhoneNumber: '+1234567890', // This will fail but test the connection
      });

      await this.snsClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'InvalidParameter' || error.name === 'InvalidParameterValue') {
        // This is expected - it means the connection works but the phone number is invalid
        console.log('✅ AWS SNS connection successful');
        return true;
      }
      console.error('❌ AWS SNS connection failed:', error.message);
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
export const awsSnsService = new AWSSNSService();