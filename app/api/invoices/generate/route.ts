import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * Generate invoices from visit fees
 * This endpoint creates invoices for visits that have fees but no corresponding invoice
 */
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, 'invoices', 'write');
  if (error) return error;

  try {
    logger.info('Starting invoice generation from visit fees');

    // Get all visits with fees
    const visits = await prisma.visit.findMany({
      include: {
        patient: true,
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
    });

    logger.info(`Found ${visits.length} visits to check for fees`);

    const createdInvoices = [];
    const failedInvoices = [];

    for (const visit of visits) {
      // Check if visit has fees
      if (!visit.fees || visit.fees.length === 0) {
        logger.info(`Visit ${visit.id} has no fees, skipping`);
        continue;
      }

      const totalAmount = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
      logger.info(`Visit ${visit.id} has ${visit.fees.length} fees, total: ₹${totalAmount}`);

      // Check if invoice already exists for this visit
      try {
        const existingInvoice = await (prisma as any).invoice.findFirst({
          where: {
            visitId: visit.id,
          },
        });

        if (existingInvoice) {
          logger.info(`Invoice already exists for visit ${visit.id}, skipping`);
          continue;
        }
      } catch (checkError) {
        logger.warn(`Could not check for existing invoice for visit ${visit.id}`, { error: checkError });
      }

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}-${visit.id.substring(0, 8)}`;
      
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
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
          include: {
            items: true,
          },
        });

        logger.info(`Created invoice ${invoiceNumber} for visit ${visit.id}`);
        createdInvoices.push(invoice);
      } catch (invoiceError) {
        logger.error(`Failed to create invoice for visit ${visit.id}`, { error: invoiceError });
        failedInvoices.push({
          visitId: visit.id,
          invoiceNumber,
          amount: totalAmount,
          error: String(invoiceError),
        });
      }
    }

    logger.info(`Generated ${createdInvoices.length} invoices from visit fees, ${failedInvoices.length} failed`);

    return Response.json(
      {
        message: `Generated ${createdInvoices.length} invoices from visit fees`,
        invoices: createdInvoices,
        failed: failedInvoices,
        summary: {
          total: createdInvoices.length + failedInvoices.length,
          created: createdInvoices.length,
          failed: failedInvoices.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to generate invoices', { error });
    return Response.json(
      { message: 'Failed to generate invoices', error: String(error) },
      { status: 500 }
    );
  }
}
