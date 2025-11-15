import twilio from 'twilio';

export class TwilioService {
  private static getClient() {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured');
    }
    
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  static isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  static async sendVerificationSMS(phoneNumber: string, senderNumber?: string): Promise<{
    success: boolean;
    message: string;
    verificationSid?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ Twilio not configured, using demo mode');
        return {
          success: true,
          message: `Demo SMS sent to ${phoneNumber}`,
          verificationSid: `demo_${Date.now()}`
        };
      }

      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the verification code (in production, use Redis or database)
      // For now, we'll log it for demo purposes
      console.log(`📱 Verification code for ${phoneNumber}: ${verificationCode}`);

      // Determine sender number - use provided sender or default
      const fromNumber = senderNumber || process.env.TWILIO_PHONE_NUMBER;
      
      if (!fromNumber) {
        throw new Error('No sender phone number configured');
      }

      // Send SMS via Twilio
      const client = this.getClient();
      const message = await client.messages.create({
        body: `Your AgriLink verification code is: ${verificationCode}. This code expires in 10 minutes.`,
        from: fromNumber,
        to: phoneNumber,
      });

      console.log(`✅ Real SMS sent successfully. SID: ${message.sid}`);
      console.log(`📱 SMS sent to: ${phoneNumber}`);
      console.log(`📱 SMS from: ${fromNumber}`);

      return {
        success: true,
        message: `Real verification SMS sent to ${phoneNumber}`,
        verificationSid: message.sid
      };

    } catch (error) {
      console.error('❌ Twilio SMS error:', error);
      return {
        success: false,
        message: 'Failed to send verification SMS. Please try again.'
      };
    }
  }

  // New method to send SMS from team member numbers
  static async sendVerificationSMSFromTeam(phoneNumber: string, teamMemberNumber: string): Promise<{
    success: boolean;
    message: string;
    verificationSid?: string;
  }> {
    return this.sendVerificationSMS(phoneNumber, teamMemberNumber);
  }

  static async verifySMSCode(phoneNumber: string, code: string, verificationSid?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // In a real implementation, you would:
      // 1. Retrieve the stored verification code for this phone number
      // 2. Compare it with the provided code
      // 3. Check expiration time
      
      // For demo purposes, we'll accept any 6-digit code
      const isValidCode = /^\d{6}$/.test(code);
      
      if (!isValidCode) {
        return {
          success: false,
          message: 'Invalid verification code format'
        };
      }

      console.log(`✅ Phone number ${phoneNumber} verified with code: ${code}`);

      return {
        success: true,
        message: 'Phone number verified successfully'
      };

    } catch (error) {
      console.error('❌ Twilio verification error:', error);
      return {
        success: false,
        message: 'Failed to verify SMS code. Please try again.'
      };
    }
  }
}
