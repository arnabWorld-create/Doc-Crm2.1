import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { paymentService } from '@/lib/payment-service';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Validation schema for confirming payment
const confirmPaymentSchema = z.object({
  paymentMethodId: z.string().optional(),
});

// Validation schema for refunding payment
const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

// GET - Get payment details
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Payment ID is required');
    }

    const payment = await (prisma as any).payment.findUnique({
      where: { id },
      include: {
        refunds: true,
        invoice: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment) {
      throw ApiErrors.notFound('Payment not found');
    }

    logger.info('Fetched payment', { paymentId: id });

    return successResponse(payment, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

// POST - Confirm payment
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Payment ID is required');
    }

    const payment = await (prisma as any).payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw ApiErrors.notFound('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw ApiErrors.badRequest('Payment is not pending');
    }

    // Confirm payment with payment service
    const paymentIntent = await paymentService.confirmPayment(
      payment.providerPaymentId!,
      data.paymentMethodId
    );

    // Update payment status
    const updatedPayment = await (prisma as any).payment.update({
      where: { id },
      data: {
        status: paymentIntent.status,
        updatedAt: new Date(),
      },
    });

    // If payment succeeded, update invoice status
    if (paymentIntent.status === 'succeeded' && payment.invoiceId) {
      await (prisma as any).invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'paid',
          paidDate: new Date(),
        },
      });
    }

    logger.info('Payment confirmed', {
      paymentId: id,
      status: paymentIntent.status,
    });

    return successResponse(updatedPayment, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: confirmPaymentSchema,
  }
);

// PUT - Refund payment
export const PUT = withMiddleware(
  async (request: NextRequest, data) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Payment ID is required');
    }

    const payment = await (prisma as any).payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw ApiErrors.notFound('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw ApiErrors.badRequest('Only succeeded payments can be refunded');
    }

    // Refund with payment service
    const refundResult = await paymentService.refundPayment(
      payment.providerPaymentId!,
      data.amount
    );

    // Create refund record
    const refund = await (prisma as any).refund.create({
      data: {
        paymentId: id,
        amount: data.amount || payment.amount,
        reason: data.reason,
        status: 'succeeded',
        providerRefundId: refundResult.refundId,
      },
    });

    // Update payment status
    const updatedPayment = await (prisma as any).payment.update({
      where: { id },
      data: {
        status: 'refunded',
        updatedAt: new Date(),
      },
    });

    logger.info('Payment refunded', {
      paymentId: id,
      refundId: refund.id,
      amount: refund.amount,
    });

    return successResponse(
      {
        payment: updatedPayment,
        refund,
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
    validateSchema: refundPaymentSchema,
  }
);
