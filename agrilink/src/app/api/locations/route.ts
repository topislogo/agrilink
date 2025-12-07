import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// GET /api/locations - Get all locations (cities and regions)
export async function GET(request: NextRequest) {
  try {
    // Get all unique cities and regions from the locations table
    const locationsData = await db
      .select({
        id: locations.id,
        city: locations.city,
        region: locations.region
      })
      .from(locations)
      .orderBy(locations.region, locations.city);

    // Group by region for better organization
    const groupedLocations = locationsData.reduce((acc, location) => {
      const region = location.region || 'Other';
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push({
        id: location.id,
        city: location.city,
        region: location.region
      });
      return acc;
    }, {} as Record<string, Array<{ id: string; city: string; region: string }>>);

    return NextResponse.json({
      locations: locationsData,
      groupedLocations,
      message: 'Locations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
