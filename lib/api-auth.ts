import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

/**
 * Middleware to protect API routes
 * Verifies JWT token from cookies
 * Returns user info if valid, or 401 error if invalid
 */
export async function requireAuth(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Token is valid, return user info
  return {
    error: null,
    user: decoded,
  };
}
