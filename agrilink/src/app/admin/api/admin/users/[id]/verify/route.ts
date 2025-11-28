import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.email !== 'admin@agrilink.com') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { verified } = body;

    // Update user verification status
    await sql`
      UPDATE user_verification 
      SET 
        verified = ${verified},
        "verificationStatus" = ${verified ? 'approved' : 'pending'},
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    return NextResponse.json({ 
      message: `User ${verified ? 'verified' : 'unverified'} successfully` 
    });

  } catch (error: any) {
    console.error('Error updating user verification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
