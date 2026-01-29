import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Validation schema for creating invoice
const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  dueDate: z.string().datetime('Invalid date format'),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
    })
  ),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET all invoices
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

    const whereClause: any = {};
    if (patientId) {
      whereClause.patientId = patientId;
    }
    if (status) {
      whereClause.status = status;
    }

    const [invoices, total] = await Promise.all([
      (prisma as any).invoice.findMany({
        where: whereClause,
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).invoice.count({ where: whereClause }),
    ]);

    logger.info('Fetched invoices', { patientId, status, page, limit, total });

    return successResponse(
      {
        data: invoices,
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

// POST - Create invoice
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const { patientId, dueDate, items, notes, metadata } = data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw ApiErrors.notFound('Patient not found');
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Generate invoice number
    const invoiceCount = await (prisma as any).invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Create invoice with items
    const invoice = await (prisma as any).invoice.create({
      data: {
        invoiceNumber,
        patientId,
        amount: totalAmount,
        dueDate: new Date(dueDate),
        notes,
        metadata: metadata ? JSON.stringify(metadata) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    logger.info('Invoice created', {
      invoiceId: invoice.id,
      invoiceNumber,
      patientId,
      amount: totalAmount,
    });

    return successResponse(invoice, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: createInvoiceSchema,
  }
);
