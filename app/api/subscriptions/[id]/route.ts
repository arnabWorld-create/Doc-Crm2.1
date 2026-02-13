import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { paymentService } from '@/lib/payment-service';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET - Get subscription details
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'settings', 'read');
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Subscription ID is required');
    }

    const subscription = await (prisma as any).subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        patient: {
          select: {
            id: true,
            name: true,
            contact: true,
          },
        },
      },
    });

    if (!subscription) {
      throw ApiErrors.notFound('Subscription not found');
    }

    logger.info('Fetched subscription', { subscriptionId: id });

    return successResponse(subscription, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

// DELETE - Cancel subscription
export const DELETE = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'settings', 'write');
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Subscription ID is required');
    }

    const subscription = await (prisma as any).subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw ApiErrors.notFound('Subscription not found');
    }

    if (subscription.status === 'canceled') {
      throw ApiErrors.badRequest('Subscription is already canceled');
    }

    // Cancel with payment service
    await paymentService.cancelSubscription(subscription.providerSubscriptionId!);

    // Update subscription status
    const canceledSubscription = await (prisma as any).subscription.update({
      where: { id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    logger.info('Subscription canceled', { subscriptionId: id });

    return successResponse(
      {
        message: 'Subscription canceled successfully',
        subscription: canceledSubscription,
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
  }
);
