import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password change API called');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('📝 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token
    let userId: string;
    try {
      console.log('🔑 JWT_SECRET present:', !!process.env.JWT_SECRET!);
      
      if (!process.env.JWT_SECRET!) {
        console.error('❌ JWT_SECRET environment variable is not set');
        return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
      console.log('✅ JWT verified, userId:', userId);
      
      if (!userId) {
        console.log('❌ No userId in token payload');
        return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 });
      }
    } catch (error: any) {
      console.error('❌ JWT verification error:', error);
      return NextResponse.json({ 
        message: error instanceof jwt.JsonWebTokenError ? 'Invalid or expired token' : 'Token verification failed' 
      }, { status: 401 });
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json();
    console.log('📝 Request body received:', { 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length 
    });

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Get user from database
    let users;
    try {
      console.log('🔍 Querying database for userId:', userId);
      users = await sql`
        SELECT id, "passwordHash" FROM users WHERE id = ${userId}
      `;
      console.log('📊 Database query result:', users.length, 'users found');
    } catch (error: any) {
      console.error('❌ Database query error:', error);
      return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
    }

    if (users.length === 0) {
      console.log('❌ User not found in database');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    console.log('👤 User found:', { id: user.id, hasPassword: !!user.passwordHash });

    // Verify current password
    console.log('🔐 Verifying current password...');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    console.log('🔐 Password verification result:', isCurrentPasswordValid);
    
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password is incorrect');
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    console.log('🔐 Hashing new password...');
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('🔐 New password hashed successfully');

    // Update password in database
    try {
      console.log('💾 Updating password in database...');
      const result = await sql`
        UPDATE users 
        SET "passwordHash" = ${hashedNewPassword}, "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
      console.log('💾 Password updated successfully:', result);
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      return NextResponse.json({ message: 'Failed to update password in database' }, { status: 500 });
    }

    console.log('✅ Password change completed successfully');
    return NextResponse.json({ 
      message: 'Password changed successfully',
      success: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Password change API error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}