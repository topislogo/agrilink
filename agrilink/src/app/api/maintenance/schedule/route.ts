import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/maintenance/schedule - Get active maintenance schedule
export async function GET(request: NextRequest) {
  try {
    // Check for active maintenance schedules
    // Maintenance should be shown if:
    // 1. It's active (isActive = true)
    // 2. Start time is within 24 hours from now
    // 3. Duration is > 15 minutes
    // 4. Start time hasn't passed yet
    
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        id,
        "startTime",
        "endTime",
        duration,
        message,
        "isActive"
      FROM maintenance_schedules
      WHERE "isActive" = true
        AND duration > 15
        AND "startTime" > ${now.toISOString()}
        AND "startTime" <= ${twentyFourHoursFromNow.toISOString()}
      ORDER BY "startTime" ASC
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return NextResponse.json({
        maintenance: null,
        shouldShow: false
      });
    }
    
    const maintenance = result[0];
    
    // Calculate if we should show the banner (24 hours before)
    const startTime = new Date(maintenance.startTime);
    const timeUntilStart = startTime.getTime() - now.getTime();
    const shouldShow = timeUntilStart > 0 && timeUntilStart <= 24 * 60 * 60 * 1000;
    
    return NextResponse.json({
      maintenance: {
        id: maintenance.id,
        startTime: maintenance.startTime,
        endTime: maintenance.endTime,
        duration: maintenance.duration,
        message: maintenance.message,
        isActive: maintenance.isActive
      },
      shouldShow
    });
    
  } catch (error: any) {
    console.error('Error fetching maintenance schedule:', error);
    // If table doesn't exist, return no maintenance
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return NextResponse.json({
        maintenance: null,
        shouldShow: false
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch maintenance schedule' },
      { status: 500 }
    );
  }
}

