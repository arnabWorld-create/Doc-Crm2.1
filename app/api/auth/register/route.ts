import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  // FIX: Increased minimum password length from 6 to 8 (medical data standard)
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  // Only admin can set a role; defaults to 'staff' for safety
  role: z.enum(['doctor', 'admin', 'staff']).optional().default('staff'),
});

export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // FIX: Registration is now admin-only.
    // This prevents arbitrary users from creating accounts and accessing patient data.
    const { error: authError } = await requireRole(request, ['admin']);
    if (authError) {
      throw ApiErrors.forbidden('Only administrators can create new user accounts');
    }

    const { email, password, name, role } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      throw ApiErrors.conflict('User already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    logger.info('User registered successfully by admin', { userId: user.id, email, role });

    return successResponse(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
      },
      201,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.AUTH,
    validateSchema: registerSchema,
    validateSource: 'body',
  }
);
