import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    const [adminUser] = await sql`
      SELECT id, email, "userType" 
      FROM users 
      WHERE id = ${decoded.userId} AND "userType" = 'admin'
    `;

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { requestId, adminNotes, reviewNotes } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the verification request details
    const [verificationRequest] = await sql`
      SELECT "userId", "userEmail", "userName"
      FROM verification_requests 
      WHERE id = ${requestId}
    `;

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    // Update verification request status
    await sql`
      UPDATE verification_requests 
      SET 
        status = 'approved',
        "reviewedAt" = NOW(),
        "reviewedBy" = ${adminUser.id},
        "reviewNotes" = ${reviewNotes || adminNotes || 'Approved by admin'},
        "updatedAt" = NOW()
      WHERE id = ${requestId}
    `;

    // Update user verification status in user_verification table
    await sql`
      UPDATE user_verification 
      SET 
        "verificationStatus" = 'verified',
        verified = true,
        "updatedAt" = NOW()
      WHERE "userId" = ${verificationRequest.userId}
    `;

    console.log(`✅ Admin ${adminUser.email} approved verification request for ${verificationRequest.userEmail}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification request approved successfully',
      userId: verificationRequest.userId // Include userId for client-side notification
    });

  } catch (error: any) {
    console.error('❌ Error approving verification request:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to approve verification request', details: error.message },
      { status: 500 }
    );
  }
}
