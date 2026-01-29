import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Validation schema for updating invoice
const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'canceled']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET - Get invoice details
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Invoice ID is required');
    }

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: {
          include: {
            refunds: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true,
          },
        },
      },
    });

    if (!invoice) {
      throw ApiErrors.notFound('Invoice not found');
    }

    logger.info('Fetched invoice', { invoiceId: id });

    return successResponse(invoice, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

// PUT - Update invoice
export const PUT = withMiddleware(
  async (request: NextRequest, data) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Invoice ID is required');
    }

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw ApiErrors.notFound('Invoice not found');
    }

    // Update invoice
    const updatedInvoice = await (prisma as any).invoice.update({
      where: { id },
      data: {
        status: data.status || invoice.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
        notes: data.notes !== undefined ? data.notes : invoice.notes,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    logger.info('Invoice updated', {
      invoiceId: id,
      status: updatedInvoice.status,
    });

    return successResponse(updatedInvoice, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: updateInvoiceSchema,
  }
);

// DELETE - Cancel invoice
export const DELETE = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      throw ApiErrors.badRequest('Invoice ID is required');
    }

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw ApiErrors.notFound('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw ApiErrors.badRequest('Cannot cancel a paid invoice');
    }

    // Update invoice status to canceled
    const canceledInvoice = await (prisma as any).invoice.update({
      where: { id },
      data: {
        status: 'canceled',
      },
    });

    logger.info('Invoice canceled', { invoiceId: id });

    return successResponse(
      {
        message: 'Invoice canceled successfully',
        invoice: canceledInvoice,
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
  }
);
