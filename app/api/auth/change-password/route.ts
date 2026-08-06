import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword, getAuthUser } from '@/lib/auth';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  // FIX: Increased minimum password length from 6 to 8 (medical data standard)
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // Get authenticated user
    const authUser = await getAuthUser();

    if (!authUser) {
      throw ApiErrors.unauthorized();
    }

    const { currentPassword, newPassword } = data;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    if (!user.isActive) {
      throw ApiErrors.forbidden('Account is inactive');
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password);

    if (!isPasswordValid) {
      logger.warn('Failed password change attempt', { userId: user.id });
      throw ApiErrors.unauthorized('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    logger.info('Password changed successfully', { userId: user.id });

    return successResponse({ message: 'Password changed successfully' }, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
    validateSchema: changePasswordSchema,
    validateSource: 'body',
  }
);
