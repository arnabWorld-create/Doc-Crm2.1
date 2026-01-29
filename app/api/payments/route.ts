import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Validation schema for creating payment
const createPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  description: z.string().optional(),
  invoiceId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'card']).optional(),
  status: z.enum(['pending', 'succeeded', 'failed']).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET all payments for a patient
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    if (!patientId) {
      throw ApiErrors.badRequest('Patient ID is required');
    }

    const whereClause: any = { patientId };
    if (status) {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      (prisma as any).payment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).payment.count({ where: whereClause }),
    ]);

    logger.info('Fetched payments', { patientId, status, page, limit, total });

    return successResponse(
      {
        data: payments,
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

// POST - Create payment
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const { patientId, amount, currency, description, invoiceId, paymentMethod, status, metadata } = data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw ApiErrors.notFound('Patient not found');
    }

    // Save payment to database
    const payment = await (prisma as any).payment.create({
      data: {
        patientId,
        amount,
        currency,
        status: status || 'succeeded',
        description,
        invoiceId,
        paymentMethod: paymentMethod || 'cash',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    logger.info('Payment created', {
      paymentId: payment.id,
      patientId,
      amount,
      currency,
      paymentMethod,
    });

    return successResponse(
      {
        payment,
      },
      201,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: createPaymentSchema,
  }
);
