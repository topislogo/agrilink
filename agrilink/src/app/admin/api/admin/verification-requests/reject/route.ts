import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Admin reject verification request called');

    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ JWT verified for userId:', decoded.userId);
    
    // Check if user is admin
    const [adminUser] = await sql`
      SELECT id, email, "userType" 
      FROM users 
      WHERE id = ${decoded.userId} AND "userType" = 'admin'
    `;

    if (!adminUser) {
      console.log('❌ Admin access required for userId:', decoded.userId);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('✅ Admin user verified:', adminUser.email);

    const { requestId, reviewNotes } = await request.json();
    console.log('📝 Rejecting request:', requestId, 'with notes:', reviewNotes);

    if (!requestId) {
      console.log('❌ Request ID is required');
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the verification request details
    const [verificationRequest] = await sql`
      SELECT "userId", "userEmail", "userName", status
      FROM verification_requests 
      WHERE id = ${requestId}
    `;

    if (!verificationRequest) {
      console.log('❌ Verification request not found:', requestId);
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    console.log('✅ Found verification request:', {
      requestId,
      userId: verificationRequest.userId,
      userEmail: verificationRequest.userEmail,
      currentStatus: verificationRequest.status
    });

    // Update verification request status
    console.log('🔄 Updating verification_requests table...');
    await sql`
      UPDATE verification_requests 
      SET 
        status = 'rejected',
        "reviewedAt" = NOW(),
        "reviewedBy" = ${adminUser.id},
        "reviewNotes" = ${reviewNotes || 'Rejected by admin'},
        "updatedAt" = NOW()
      WHERE id = ${requestId}
    `;
    console.log('✅ Updated verification_requests table');

    // Get current verification documents before moving them to rejected (from user_verification table)
    const [userWithDocs] = await sql`
      SELECT "verificationDocuments"
      FROM user_verification 
      WHERE "userId" = ${verificationRequest.userId}
    `;

    // Ensure rejectedDocuments column exists
    await sql`
      ALTER TABLE user_verification
      ADD COLUMN IF NOT EXISTS "rejectedDocuments" jsonb
    `;

    // Prefer documents attached to the verification request; fallback to user_verification
    const [reqDocsRow] = await sql`
      SELECT "verificationDocuments"
      FROM verification_requests
      WHERE id = ${requestId}
    `;
    const [uvDocsRow] = await sql`
      SELECT "verificationDocuments"
      FROM user_verification
      WHERE "userId" = ${verificationRequest.userId}
    `;
    const docsToReject = (reqDocsRow && reqDocsRow.verificationDocuments) || (uvDocsRow && uvDocsRow.verificationDocuments) || null;

    // Check current verification status before updating
    const [currentVerification] = await sql`
      SELECT "verificationStatus", verified
      FROM user_verification 
      WHERE "userId" = ${verificationRequest.userId}
    `;

    // Only update verification status if user is not already verified
    // If user is already verified, only move documents but keep verification status
    const shouldUpdateStatus = !currentVerification?.verified;
    const newStatus = shouldUpdateStatus ? 'rejected' : currentVerification?.verificationStatus || 'rejected';
    
    console.log('📊 Current verification status:', currentVerification);
    console.log('📊 Should update status:', shouldUpdateStatus);
    console.log('📊 New status will be:', newStatus);

    // Move/clear documents in user_verification and conditionally update status
    await sql`
      UPDATE user_verification 
      SET 
        "rejectedDocuments" = ${docsToReject},
        "verificationDocuments" = NULL,
        "verificationStatus" = ${newStatus},
        "updatedAt" = NOW()
      WHERE "userId" = ${verificationRequest.userId}
    `;
    console.log('✅ Moved documents to rejectedDocuments, cleared active documents, and updated status to:', newStatus);

    // Check if user_verification record exists
    const [existingVerification] = await sql`
      SELECT "userId", "verificationStatus", verified
      FROM user_verification 
      WHERE "userId" = ${verificationRequest.userId}
    `;

    if (!existingVerification) {
      console.log('⚠️  No user_verification record found, creating one...');
      await sql`
        INSERT INTO user_verification (
          "userId", verified, "phoneVerified", "verificationStatus", "verificationSubmitted", "createdAt", "updatedAt"
        ) VALUES (
          ${verificationRequest.userId}, false, true, 'rejected', true, NOW(), NOW()
        )
      `;
      console.log('✅ Created user_verification record');
    } else {
      console.log('📊 Current user_verification status after update:', existingVerification);
      console.log('✅ User verification record already updated above');
    }

    console.log(`❌ Admin ${adminUser.email} rejected verification request for ${verificationRequest.userEmail}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification request rejected successfully',
      userId: verificationRequest.userId // Include userId for client-side notification
    });

  } catch (error: any) {
    console.error('❌ Error rejecting verification request:', error);
    return NextResponse.json(
      { error: 'Failed to reject verification request' },
      { status: 500 }
    );
  }
}
