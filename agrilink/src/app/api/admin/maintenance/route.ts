import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.userType !== 'admin' && decoded.email !== 'admin@agrilink.com') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/maintenance - Get all maintenance schedules
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT 
        id,
        "startTime",
        "endTime",
        duration,
        message,
        "isActive",
        "createdAt",
        "updatedAt"
      FROM maintenance_schedules
      ORDER BY "startTime" DESC
    `;
    
    return NextResponse.json({
      schedules: result
    });
    
  } catch (error: any) {
    console.error('Error fetching maintenance schedules:', error);
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return NextResponse.json({
        schedules: []
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch maintenance schedules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/maintenance - Create new maintenance schedule
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startTime, endTime, duration, message } = body;

    // Validate required fields
    if (!startTime || !endTime || !duration) {
      return NextResponse.json(
        { error: 'startTime, endTime, and duration are required' },
        { status: 400 }
      );
    }

    // Validate duration > 15 minutes
    if (duration <= 15) {
      return NextResponse.json(
        { error: 'Maintenance duration must be greater than 15 minutes' },
        { status: 400 }
      );
    }

    // Validate start time is in the future
    const start = new Date(startTime);
    const now = new Date();
    if (start <= now) {
      return NextResponse.json(
        { error: 'Start time must be in the future' },
        { status: 400 }
      );
    }

    // Create maintenance schedule
    const result = await sql`
      INSERT INTO maintenance_schedules (
        id,
        "startTime",
        "endTime",
        duration,
        message,
        "isActive",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${startTime},
        ${endTime},
        ${duration},
        ${message || null},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    return NextResponse.json({
      schedule: result[0],
      message: 'Maintenance schedule created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create maintenance schedule', details: error.message },
      { status: 500 }
    );
  }
}

