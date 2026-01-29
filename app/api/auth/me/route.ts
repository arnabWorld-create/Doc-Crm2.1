import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  try {
    // Get user from token
    const authUser = await getAuthUser();

    if (!authUser) {
      logger.warn('Unauthorized access attempt to /api/auth/me');
      throw ApiErrors.unauthorized('Not authenticated');
    }

    // Fetch full user details
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      logger.warn('User not found', { userId: authUser.userId });
      throw ApiErrors.notFound('User not found');
    }

    return successResponse(user, 200, request);
  } catch (error) {
    logger.error('Error in /api/auth/me', error);
    throw error;
  }
}

export const GET = withMiddleware(handler);
