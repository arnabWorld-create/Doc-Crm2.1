import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// Validation schema for creating plan
const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  interval: z.enum(['month', 'year']).default('month'),
  intervalCount: z.number().int().positive().default(1),
  trialDays: z.number().int().nonnegative().optional(),
  features: z.array(z.string()).optional(),
});

// GET all subscription plans
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'settings', 'read');
    if (error) throw error;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive') !== 'false';

    const plans = await (prisma as any).subscriptionPlan.findMany({
      where: {
        isActive,
      },
      orderBy: { amount: 'asc' },
    });

    logger.info('Fetched subscription plans', { count: plans.length, isActive });

    return successResponse(
      {
        data: plans,
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

// POST - Create subscription plan
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const { error } = await requirePermission(request, 'settings', 'write');
    if (error) throw error;

    const { name, description, amount, currency, interval, intervalCount, trialDays, features } = data;

    // Check if plan with same name already exists
    const existingPlan = await (prisma as any).subscriptionPlan.findFirst({
      where: { name },
    });

    if (existingPlan) {
      throw ApiErrors.conflict('Subscription plan with this name already exists');
    }

    // Create plan
    const plan = await (prisma as any).subscriptionPlan.create({
      data: {
        name,
        description,
        amount,
        currency,
        interval,
        intervalCount,
        trialDays,
        features: features ? JSON.stringify(features) : null,
        isActive: true,
      },
    });

    logger.info('Subscription plan created', {
      planId: plan.id,
      name,
      amount,
    });

    return successResponse(plan, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: createPlanSchema,
  }
);
