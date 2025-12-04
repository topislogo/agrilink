import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error: any) {
      console.error('JWT verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('🔍 Fetching verification status for user:', user.userId);

    // Get the latest verification request for this user
    const [latestRequest] = await sql`
      SELECT id, status, "submittedAt", "reviewedAt", "reviewNotes", "verificationDocuments"
      FROM verification_requests 
      WHERE "userId" = ${user.userId}
      ORDER BY "submittedAt" DESC
      LIMIT 1
    `;

    console.log('📋 Latest verification request:', latestRequest);

    // Transform field names to match frontend expectations
    const transformedRequest = latestRequest ? {
      ...latestRequest,
      review_notes: latestRequest.reviewNotes,
      reviewed_at: latestRequest.reviewedAt,
      submitted_at: latestRequest.submittedAt
    } : null;

    return NextResponse.json({
      success: true,
      verificationRequest: transformedRequest
    });

  } catch (error: any) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
