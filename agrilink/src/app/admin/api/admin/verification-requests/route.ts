import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

// Simple in-memory cache for verification requests
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds



export async function GET(request: NextRequest) {
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

    // Check if force refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Check cache first (unless force refresh)
    const cacheKey = 'verification_requests';
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached verification requests');
      return NextResponse.json({ 
        success: true, 
        requests: cached.data,
        cached: true
      });
    }

    // Fetch all verification requests with user profile data
    console.log('🔍 Fetching verification requests from database...');
    
    // Fetch all verification requests with user profile data
    const requests = await sql`
      SELECT 
        vr.id,
        vr."userId",
        vr."userEmail",
        vr."userName",
        vr."userType",
        vr."accountType",
        vr."requestType",
        vr.status,
        vr."submittedAt",
        vr."reviewedAt",
        vr."reviewedBy",
        vr."verificationDocuments" as verification_request_documents,
        vr."businessInfo",
        vr."phoneVerified" as verification_phone_verified,
        vr."reviewNotes",
        up.phone,
        uv."phoneVerified" as user_phone_verified,
        uv."verificationDocuments" as user_verification_documents,
        uv."rejectedDocuments" as user_rejected_documents,
        uv.verified as user_verified,
        uv."verificationStatus" as user_verification_status,
        bd."businessName",
        bd."businessDescription", 
        bd."businessLicenseNumber",
        CASE 
          WHEN l.city IS NOT NULL AND l.region IS NOT NULL 
          THEN l.city || ', ' || l.region
          ELSE 'Unknown Location'
        END as location
      FROM verification_requests vr
      LEFT JOIN user_profiles up ON vr."userId" = up."userId"
      LEFT JOIN user_verification uv ON vr."userId" = uv."userId"
      LEFT JOIN business_details bd ON vr."userId" = bd."userId"
      LEFT JOIN locations l ON up."locationId" = l.id
      ORDER BY vr."submittedAt" DESC
    `;

    console.log('✅ Verification requests fetched:', requests.length);

    // Cache the results
    cache.set(cacheKey, {
      data: requests || [],
      timestamp: now
    });

    return NextResponse.json({ 
      success: true, 
      requests: requests || [] 
    });

  } catch (error: any) {
    console.error('❌ Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}

// Cache invalidation endpoint
export async function DELETE(request: NextRequest) {
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

    // Clear cache
    cache.clear();
    console.log('🗑️ Cache cleared by admin');

    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });

  } catch (error: any) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
