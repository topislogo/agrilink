import { NextRequest, NextResponse } from 'next/server';
import { twilioService } from '@/lib/twilio-service';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

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
        const { phoneNumber, code, verificationId } = body;

        if (!phoneNumber || !code) {
            return NextResponse.json(
                { error: 'Phone number and verification code are required' },
                { status: 400 }
            );
        }

         // Verify code using Twilio service
        const result = await twilioService.verifyCode(userId, phoneNumber, code);
        
        if (!result.success) {
            const errorMessage = result.error || result.message || 'Failed to verify code';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        // Update user's phone number in the user_profiles table
        await sql`
        UPDATE user_profiles 
        SET 
            phone = ${phoneNumber},
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
        `;

        // Update user verification status
        await sql`
        UPDATE user_verification 
        SET 
            "phoneVerified" = true,
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
        `;

        console.log(`✅ Phone number updated in database: ${phoneNumber} for user ${userId}`);
        return NextResponse.json({
            success: true,
            message: result.message || 'Phone number verified and updated successfully',
            phoneNumber
        });

    }catch (error:any) {
        console.error('Error verifying SMS code:', error);
        return NextResponse.json(
            { error: 'Failed to verify SMS code' },
            { status: 500 }
        );
    }
}