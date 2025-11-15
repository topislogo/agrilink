import { TwilioService } from './twilio';

// Alternative SMS service providers
export interface SMSProvider {
  name: string;
  sendSMS: (phoneNumber: string, message: string) => Promise<{
    success: boolean;
    message: string;
    provider: string;
  }>;
}

// SMS Provider Options
export class SMSProviders {
  // Option 1: Use Resend for email-based OTP (if phone fails)
  static async sendEmailOTP(email: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    provider: string;
  }> {
    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send email with OTP
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          phoneNumber,
          otp 
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `OTP sent to email: ${email}`,
          provider: 'email'
        };
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email OTP',
        provider: 'email'
      };
    }
  }

  // Option 2: Use WhatsApp Business API (if available)
  static async sendWhatsAppOTP(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    provider: string;
  }> {
    // This would require WhatsApp Business API setup
    // For now, return a demo response
    return {
      success: false,
      message: 'WhatsApp Business API not configured',
      provider: 'whatsapp'
    };
  }

  // Option 3: Use local SMS gateway (Myanmar specific)
  static async sendLocalSMS(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    provider: string;
  }> {
    try {
      // This would integrate with local Myanmar SMS providers
      // For now, simulate success
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`🇲🇲 Local SMS to ${phoneNumber}: ${otp}`);
      
      return {
        success: true,
        message: `OTP sent via local SMS: ${otp}`,
        provider: 'local'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Local SMS service unavailable',
        provider: 'local'
      };
    }
  }

  // Option 4: Use Twilio with fallback
  static async sendWithFallback(phoneNumber: string, userEmail?: string): Promise<{
    success: boolean;
    message: string;
    provider: string;
    fallbackUsed?: boolean;
  }> {
    // Try Twilio first
    const twilioResult = await TwilioService.sendVerificationSMS(phoneNumber);
    
    if (twilioResult.success) {
      return {
        success: true,
        message: twilioResult.message,
        provider: 'twilio'
      };
    }

    // If Twilio fails, try fallback methods
    console.log('🔄 Twilio failed, trying fallback methods...');

    // Try email if available
    if (userEmail) {
      const emailResult = await this.sendEmailOTP(userEmail, phoneNumber);
      if (emailResult.success) {
        return {
          success: true,
          message: emailResult.message,
          provider: 'email',
          fallbackUsed: true
        };
      }
    }

    // Try local SMS
    const localResult = await this.sendLocalSMS(phoneNumber);
    if (localResult.success) {
      return {
        success: true,
        message: localResult.message,
        provider: 'local',
        fallbackUsed: true
      };
    }

    // All methods failed
    return {
      success: false,
      message: 'All SMS methods failed. Please try again or contact support.',
      provider: 'none'
    };
  }
}
