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

// PATCH /api/admin/maintenance/[id] - Update maintenance schedule (cancel/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }

    // Update maintenance schedule
    const result = await sql`
      UPDATE maintenance_schedules
      SET 
        "isActive" = ${isActive},
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      schedule: result[0],
      message: isActive 
        ? 'Maintenance schedule activated successfully' 
        : 'Maintenance schedule cancelled successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance schedule', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/maintenance/[id] - Delete maintenance schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete maintenance schedule
    const result = await sql`
      DELETE FROM maintenance_schedules
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Maintenance schedule deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting maintenance schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete maintenance schedule', details: error.message },
      { status: 500 }
    );
  }
}

