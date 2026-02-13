import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Test login attempt for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error('Test login error:', error);
    const { sanitizeErrorForClient } = await import('@/lib/sanitize-error');
    return NextResponse.json(
      { error: 'Internal server error', message: sanitizeErrorForClient(error) },
      { status: 500 }
    );
  }
}
