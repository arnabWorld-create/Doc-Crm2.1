import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// Max visits to process in a single generate call — prevents OOM
const BATCH_LIMIT = 1000;

/**
 * Generate invoices from visit fees.
 * Creates invoices for visits that have fees but no corresponding invoice.
 * Processes in pages of BATCH_LIMIT to avoid loading the entire DB into memory.
 */
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, 'invoices', 'write');
  if (error) return error;

  try {
    logger.info('Starting invoice generation from visit fees');

    const createdInvoices: any[] = [];
    const failedInvoices: any[] = [];
    let cursor: string | undefined;
    let totalChecked = 0;

    // Cursor-based pagination — never loads the whole table into memory
    while (totalChecked < BATCH_LIMIT) {
      const visits = await prisma.visit.findMany({
        take: 50,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          patientId: true,
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
      });

      if (visits.length === 0) break;

      for (const visit of visits) {
        totalChecked++;

        // Skip visits with no fees
        if (!visit.fees || visit.fees.length === 0) continue;

        const totalAmount = visit.fees.reduce((sum, fee) => sum + fee.total, 0);

        // Check if invoice already exists for this visit
        let existingInvoice: any = null;
        try {
          existingInvoice = await (prisma as any).invoice.findFirst({
            where: { visitId: visit.id },
            select: { id: true },
          });
        } catch {
          // invoice table may not have visitId column in older schemas — skip check
        }

        if (existingInvoice) continue;

        // Generate invoice number from the DB sequence
        let invoiceNumber: string;
        try {
          const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
            SELECT nextval('invoice_number_seq') AS nextval
          `;
          const seq = Number(result[0].nextval);
          invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
        } catch {
          invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;
        }

        try {
          const invoice = await (prisma as any).invoice.create({
            data: {
              invoiceNumber,
              patientId: visit.patientId,
              visitId: visit.id,
              amount: totalAmount,
              currency: 'INR',
              status: 'pending',
              issuedDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              items: {
                create: visit.fees.map(fee => ({
                  description: fee.serviceName,
                  quantity: fee.quantity,
                  unitPrice: fee.amount,
                  discount: fee.discount,
                  total: fee.total,
                })),
              },
            },
            select: { id: true, invoiceNumber: true, amount: true },
          });

          createdInvoices.push(invoice);
        } catch (invoiceErr: any) {
          // Log full error server-side only — never send to client
          logger.error('Failed to create invoice for visit', invoiceErr, { visitId: visit.id });
          failedInvoices.push({ visitId: visit.id, invoiceNumber });
        }
      }

      if (visits.length < 50) break;
      cursor = visits[visits.length - 1].id;
    }

    logger.info('Invoice generation complete', {
      created: createdInvoices.length,
      failed: failedInvoices.length,
      checked: totalChecked,
    });

    return Response.json({
      message: `Generated ${createdInvoices.length} invoice${createdInvoices.length !== 1 ? 's' : ''} from visit fees`,
      summary: {
        created: createdInvoices.length,
        failed: failedInvoices.length,
        checked: totalChecked,
      },
    });
  } catch (error) {
    logger.error('Invoice generation failed', error);
    return Response.json(
      { message: 'Failed to generate invoices. Please try again.' },
      { status: 500 }
    );
  }
}
