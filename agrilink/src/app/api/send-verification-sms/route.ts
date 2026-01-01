import { NextRequest, NextResponse } from 'next/server';
import { twilioService } from '@/lib/twilio-service';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;

        const body = await request.json();
        const { phoneNumber } = body;

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const result = await twilioService.sendVerificationCode(userId, phoneNumber);

        if (!result.success) {
            const errorMessage = result.error || result.message || 'Failed to send verification code';
            return NextResponse.json(
                { error: errorMessage },
                { status: errorMessage.includes('wait a minute') ? 429 : 400  }
            );
        }

        // Include OTP code in response for development/testing purposes
        // During development: OTP is shown in UI for testing
        // In production/post-MVP: OTP will be sent directly via SMS to mobile phone
        const response: any = { 
            success: true,
            message: result.message ||  'Verification code sent successfully',
            verificationId: result.verificationId
        };

        // Include code in development mode only
        // In production, the code will be sent via SMS and not shown in UI
        const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.SHOW_OTP_IN_DEV === 'true';
        if (result.code && isDevelopment) {
            response.code = result.code;
            response.developmentMode = true; // Indicate this is for development/testing
        }

        return NextResponse.json(response);

    }catch (error:any) {
        console.error('Error sending verification SMS:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to send verification SMS';
        return NextResponse.json(
        { 
            success: false,
            error: errorMessage 
        },
        { status: 500 });
    }
}