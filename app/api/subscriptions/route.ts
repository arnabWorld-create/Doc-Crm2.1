import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { paymentService } from '@/lib/payment-service';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// Validation schema for creating subscription
const createSubscriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  metadata: z.record(z.any()).optional(),
});

// GET all subscriptions
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'settings', 'read');
    if (error) throw error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (patientId) {
      whereClause.patientId = patientId;
    }
    if (status) {
      whereClause.status = status;
    }

    const [subscriptions, total] = await Promise.all([
      (prisma as any).subscription.findMany({
        where: whereClause,
        include: {
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).subscription.count({ where: whereClause }),
    ]);

    logger.info('Fetched subscriptions', { patientId, status, page, limit, total });

    return successResponse(
      {
        data: subscriptions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

// POST - Create subscription
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const { error } = await requirePermission(request, 'settings', 'write');
    if (error) throw error;

    const { patientId, planId, metadata } = data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw ApiErrors.notFound('Patient not found');
    }

    // Verify plan exists
    const plan = await (prisma as any).subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw ApiErrors.notFound('Subscription plan not found');
    }

    if (!plan.isActive) {
      throw ApiErrors.badRequest('Subscription plan is not active');
    }

    // Create subscription with payment service
    const subscription = await paymentService.createSubscription(
      patientId,
      planId,
      metadata
    );

    // Save subscription to database
    const savedSubscription = await (prisma as any).subscription.create({
      data: {
        patientId,
        planId,
        status: 'active',
        provider: 'stripe',
        providerSubscriptionId: subscription.id,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        plan: true,
      },
    });

    logger.info('Subscription created', {
      subscriptionId: savedSubscription.id,
      patientId,
      planId,
    });

    return successResponse(savedSubscription, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: createSubscriptionSchema,
  }
);
