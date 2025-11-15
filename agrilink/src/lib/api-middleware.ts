/**
 * API Middleware for Email Verification
 * Provides middleware functions to check email verification on API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';
import { isEmailVerified, requiresEmailVerification, getEmailVerificationErrorMessage } from './email-verification';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  userType: string;
  accountType: string;
}

/**
 * Verify JWT token and get user data
 */
export async function verifyToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get fresh user data from database
    const userResult = await sql`
      SELECT id, email, name, "emailVerified", "userType", "accountType"
      FROM users 
      WHERE id = ${decoded.userId}
    `;
    
    if (userResult.length === 0) {
      return null;
    }
    
    return userResult[0] as AuthenticatedUser;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to check email verification for specific actions
 */
export function requireEmailVerification(action: string) {
  return async function middleware(request: NextRequest): Promise<NextResponse | null> {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if action requires email verification
    if (requiresEmailVerification(action) && !isEmailVerified(user)) {
      return NextResponse.json(
        { 
          error: 'Email verification required',
          message: getEmailVerificationErrorMessage(action),
          requiresEmailVerification: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified
          }
        },
        { status: 403 }
      );
    }
    
    return null; // Continue to the actual API handler
  };
}

/**
 * Middleware to check if user is authenticated (with optional email verification check)
 */
export function requireAuth(requireEmailVerification: boolean = false) {
  return async function middleware(request: NextRequest): Promise<NextResponse | null> {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (requireEmailVerification && !isEmailVerified(user)) {
      return NextResponse.json(
        { 
          error: 'Email verification required',
          message: 'Please verify your email address to access this feature',
          requiresEmailVerification: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified
          }
        },
        { status: 403 }
      );
    }
    
    return null; // Continue to the actual API handler
  };
}

/**
 * Helper function to check email verification in API routes
 */
export async function checkEmailVerification(request: NextRequest, action: string): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  const user = await verifyToken(request);
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  
  if (requiresEmailVerification(action) && !isEmailVerified(user)) {
    return {
      user,
      error: NextResponse.json(
        { 
          error: 'Email verification required',
          message: getEmailVerificationErrorMessage(action),
          requiresEmailVerification: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified
          }
        },
        { status: 403 }
      )
    };
  }
  
  return { user, error: null };
}
