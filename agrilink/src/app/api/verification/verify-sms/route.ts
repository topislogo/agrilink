import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
    try{
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;

        const body = await request.json();
        const { phone, code } = body;

        if (!phone || !code) {
        return NextResponse.json({ message: 'Phone number and code are required' }, { status: 400 });
        }

        // Check verification code
        const codeResult = await sql`
        SELECT * FROM verification_codes 
        WHERE "userId" = ${userId} 
        AND phone = ${phone} 
        AND code = ${code}
        AND "expiresAt" > NOW()
        ORDER BY "createdAt" DESC
        LIMIT 1
        `;

        if (codeResult.length === 0) {
            return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
        }

        // Update user's phone number in the user_profiles table
        await sql`
        UPDATE user_profiles 
        SET 
            phone = ${phone},
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

        // Delete used verification code
        await sql`
        DELETE FROM verification_codes 
        WHERE "userId" = ${userId} AND code = ${code}
        `;
        console.log(`✅ Phone number updated in database: ${phone} for user ${userId}`);

        return NextResponse.json({
            message: 'Phone number verified and updated successfully'
        });

    }catch (error: any) {
        console.error('Error verifying code:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}