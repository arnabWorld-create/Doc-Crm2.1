import { NextRequest } from 'next/server';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { requirePermission } from '@/lib/rbac';

/**
 * GET /api/invoices/summary
 * Fetch all invoices with patient details in a single optimized query
 * This replaces the N+1 query pattern of fetching patients then individual patient details
 */
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const { error } = await requirePermission(request, 'invoices', 'read');
    if (error) throw error;

    try {
      const prisma = require('@/lib/prisma').default;
      
      // Fetch all patients with their visits in one query
      const patients = await prisma.patient.findMany({
        select: {
          id: true,
          name: true,
          visits: {
            select: {
              id: true,
              createdAt: true,
              notes: true,
              paidBy: true,
              fees: {
                select: {
                  id: true,
                  serviceName: true,
                  amount: true,
                  quantity: true,
                  discount: true,
                  total: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform visits into invoices
      const invoices: any[] = [];
      
      for (const patient of patients) {
        if (patient.visits && Array.isArray(patient.visits)) {
          for (const visit of patient.visits) {
            if (visit.fees && visit.fees.length > 0) {
              const totalAmount = visit.fees.reduce((sum: number, fee: any) => sum + fee.total, 0);
              invoices.push({
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
              });
            }
          }
        }
      }

      logger.info('Fetched invoices summary', { count: invoices.length });

      return successResponse({
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      logger.error('Failed to fetch invoices summary', error);
      throw error;
    }
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);
