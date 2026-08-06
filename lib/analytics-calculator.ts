import prisma from './prisma';
import { logger } from './logger';

interface PatientAnalytics {
  id: string;
  patientId: string;
  name: string;
  contact?: string | null;
  totalVisits: number;
  totalFeesGenerated: number;
  averageFeePerVisit: number;
  firstVisitDate: string;
  lastVisitDate: string;
  visitFrequency: 'High' | 'Medium' | 'Low';
  paymentMethods: { [key: string]: number };
  monthlyVisits: { month: string; visits: number; fees: number }[];
  recentVisits: {
    id: string;
    visitDate: string;
    visitType: string;
    fees: number;
    paidBy?: string;
  }[];
}

// FIX: Process patients in batches to prevent memory exhaustion and timeouts.
// Previously loaded ALL patients + their relations in a single query, which
// caused OOM errors at ~41+ patients with large visit histories.
const BATCH_SIZE = 50;

async function processPatientBatch(
  patients: Awaited<ReturnType<typeof fetchPatientBatch>>
): Promise<PatientAnalytics[]> {
  return patients
    .map(patient => {
      const visits = patient.visits;
      const invoices = patient.invoices;

      // Skip patients with no visits
      if (visits.length === 0) return null;

      // Calculate total fees from VisitFee table
      let totalFeesFromVisits = 0;
      const paymentMethodCounts: { [key: string]: number } = {};

      visits.forEach(visit => {
        const visitTotal = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
        totalFeesFromVisits += visitTotal;

        if (visit.paidBy) {
          paymentMethodCounts[visit.paidBy] = (paymentMethodCounts[visit.paidBy] || 0) + 1;
        }
      });

      // Also include paid invoice amounts
      const totalFeesFromInvoices = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

      // Use the higher of the two to avoid double counting
      const totalFeesGenerated = Math.max(totalFeesFromVisits, totalFeesFromInvoices);

      // Calculate visit frequency
      const visitTimes = visits.map(v => new Date(v.visitDate).getTime());
      const firstVisit = new Date(Math.min(...visitTimes));
      const lastVisit = new Date(Math.max(...visitTimes));
      const monthsDiff = Math.max(
        1,
        (lastVisit.getTime() - firstVisit.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      const visitsPerMonth = visits.length / monthsDiff;

      let visitFrequency: 'High' | 'Medium' | 'Low';
      if (visitsPerMonth >= 2) visitFrequency = 'High';
      else if (visitsPerMonth >= 0.5) visitFrequency = 'Medium';
      else visitFrequency = 'Low';

      // Monthly breakdown (last 12 months only)
      const monthlyMap = new Map<string, { visits: number; fees: number }>();
      visits.forEach(visit => {
        const date = new Date(visit.visitDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const visitFees = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
        const existing = monthlyMap.get(monthKey) || { visits: 0, fees: 0 };
        monthlyMap.set(monthKey, {
          visits: existing.visits + 1,
          fees: existing.fees + visitFees,
        });
      });

      const monthlyVisits = Array.from(monthlyMap.entries())
        .sort()
        .slice(-12)
        .map(([month, data]) => ({ month, visits: data.visits, fees: data.fees }));

      // Recent visits (last 5)
      const recentVisits = visits.slice(0, 5).map(visit => ({
        id: visit.id,
        visitDate: visit.visitDate.toISOString(),
        visitType: visit.visitType,
        fees: visit.fees.reduce((sum, fee) => sum + fee.total, 0),
        paidBy: visit.paidBy || undefined,
      }));

      return {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        contact: patient.contact || undefined,
        totalVisits: visits.length,
        totalFeesGenerated,
        averageFeePerVisit: visits.length > 0 ? totalFeesGenerated / visits.length : 0,
        firstVisitDate: firstVisit.toISOString(),
        lastVisitDate: lastVisit.toISOString(),
        visitFrequency,
        paymentMethods: paymentMethodCounts,
        monthlyVisits,
        recentVisits,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
}

async function fetchPatientBatch(cursor?: string) {
  return prisma.patient.findMany({
    take: BATCH_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: 'asc' },
    select: {
      id: true,
      patientId: true,
      name: true,
      contact: true,
      visits: {
        orderBy: { visitDate: 'desc' },
        select: {
          id: true,
          visitDate: true,
          visitType: true,
          paidBy: true,
          fees: {
            select: { total: true },
          },
        },
      },
      invoices: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  });
}

export async function calculatePatientAnalytics() {
  const startTime = Date.now();

  try {
    logger.info('Starting analytics calculation');

    const allAnalytics: PatientAnalytics[] = [];
    let cursor: string | undefined;
    let batchCount = 0;

    // Cursor-based pagination — processes patients in batches of BATCH_SIZE
    // to avoid loading the entire dataset into memory at once.
    while (true) {
      const batch = await fetchPatientBatch(cursor);

      if (batch.length === 0) break;

      const batchAnalytics = await processPatientBatch(batch);
      allAnalytics.push(...batchAnalytics);

      batchCount++;
      logger.info(`Processed batch ${batchCount}`, {
        batchSize: batch.length,
        totalProcessed: allAnalytics.length,
      });

      if (batch.length < BATCH_SIZE) break;
      cursor = batch[batch.length - 1].id;
    }

    // Calculate summary statistics
    const summary = {
      totalPatients: allAnalytics.length,
      totalVisitsAll: allAnalytics.reduce((sum, p) => sum + p.totalVisits, 0),
      totalRevenueAll: allAnalytics.reduce((sum, p) => sum + p.totalFeesGenerated, 0),
      averageVisitsPerPatient:
        allAnalytics.length > 0
          ? allAnalytics.reduce((sum, p) => sum + p.totalVisits, 0) / allAnalytics.length
          : 0,
      averageRevenuePerPatient:
        allAnalytics.length > 0
          ? allAnalytics.reduce((sum, p) => sum + p.totalFeesGenerated, 0) / allAnalytics.length
          : 0,
      frequencyDistribution: {
        high: allAnalytics.filter(p => p.visitFrequency === 'High').length,
        medium: allAnalytics.filter(p => p.visitFrequency === 'Medium').length,
        low: allAnalytics.filter(p => p.visitFrequency === 'Low').length,
      },
    };

    const cacheData = {
      data: allAnalytics,
      summary,
      calculatedAt: new Date().toISOString(),
    };

    await prisma.analyticsCache.upsert({
      where: { cacheKey: 'patient_analytics_all' },
      create: {
        cacheKey: 'patient_analytics_all',
        data: JSON.stringify(cacheData),
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      },
      update: {
        data: JSON.stringify(cacheData),
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    });

    const calculationTime = Date.now() - startTime;

    logger.info('Analytics calculation completed', {
      totalPatients: allAnalytics.length,
      batches: batchCount,
      calculationTime: `${calculationTime}ms`,
    });

    return { success: true, calculationTime, totalPatients: allAnalytics.length };
  } catch (error) {
    logger.error('Analytics calculation failed', error);
    throw error;
  }
}
