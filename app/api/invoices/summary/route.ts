import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requirePermission } from '@/lib/rbac';

/**
 * GET /api/invoices/summary
 * Returns a paginated, fee-based invoice summary across all patients.
 * Previously loaded ALL patients + visits + fees with no limit (OOM risk).
 * Now uses pagination and a hard cap of 200 records per request.
 */
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'invoices', 'read');
    if (error) throw error;

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip  = (page - 1) * limit;

    // Single query — paginated, no unbounded load
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        visits: {
          select: {
            id: true,
            createdAt: true,
            paidBy: true,
            fees: {
              select: {
                id: true,
                serviceName: true,
                amount: true,
                quantity: true,
                discount: true,
                total: true,
              },
            },
          },
          where: { fees: { some: {} } }, // only visits that have fees
          orderBy: { createdAt: 'desc' },
          take: 20, // cap visits per patient
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const invoices = patients.flatMap(patient =>
      patient.visits.map(visit => {
        const totalAmount = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
        return {
          id: visit.id,
          invoiceNumber: `INV-${visit.id.substring(0, 8)}`,
          patientId: patient.id,
          patientName: patient.name,
          amount: totalAmount,
          status: visit.paidBy ? 'paid' : 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: visit.createdAt,
          visitId: visit.id,
          paymentMethod: visit.paidBy || undefined,
        };
      })
    );

    logger.info('Fetched invoices summary', { page, limit, count: invoices.length });

    return successResponse({
      data: invoices,
      count: invoices.length,
      pagination: { page, limit },
    });
  },
  { rateLimit: RATE_LIMITS.API }
);
