import { NextRequest, NextResponse } from 'next/server';
import { SMSProviders } from '@/lib/smsService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, userEmail, preferredMethod = 'auto' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number with country code' },
        { status: 400 }
      );
    }

    let result;

    // Try different methods based on preference
    switch (preferredMethod) {
      case 'email':
        if (!userEmail) {
          return NextResponse.json(
            { error: 'Email is required for email method' },
            { status: 400 }
          );
        }
        result = await SMSProviders.sendEmailOTP(userEmail, phoneNumber);
        break;
        
      case 'local':
        result = await SMSProviders.sendLocalSMS(phoneNumber);
        break;
        
      case 'auto':
      default:
        result = await SMSProviders.sendWithFallback(phoneNumber, userEmail);
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed || false
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      },
      { status: 500 }
    );
  }
}
