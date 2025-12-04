import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

export async function POST(request:NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        let user;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET!) as any;
        } catch (error:any) {
            console.error('JWT verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        console.log('Resetting verification status for user:', user.userID);

        await sql`
            UPDATE user_verification 
            SET 
                "verificationStatus" = 'phone-verified',
                verified = false,
                "verificationSubmitted" = false,
                "updatedAt" = NOW()
            WHERE "userId" = ${user.userId}
        `;

        await sql`
            UPDATE users 
            SET 
                "agriLinkVerificationRequested" = false,
                "agriLinkVerificationRequestedAt" = NULL,
                "verificationDocuments" = NULL,
                "updatedAt" = NOW()
            WHERE id = ${user.userId}
        `;
        console.log('✅ Verification status reset successfully (rejection history preserved)');
        return NextResponse.json(
            { 
                success: true,
                message: 'User verification status reset successfully'
            });
    } catch (error:any) {
        console.error('Error resetting verification status:', error);
        return NextResponse.json(
            {error: 'Internal Server Error'},
            {status: 500}
        );
    }
}