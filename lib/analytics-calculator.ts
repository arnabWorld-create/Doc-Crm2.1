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

export async function calculatePatientAnalytics() {
  const startTime = Date.now();
  
  try {
    logger.info('Starting analytics calculation');
    
    // Fetch all patients with their visits and payment data
    const patients = await prisma.patient.findMany({
      include: {
        visits: {
          include: {
            fees: true,
          },
          orderBy: { visitDate: 'desc' },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    
    // Process analytics for each patient
    const analyticsData: PatientAnalytics[] = patients
      .map(patient => {
        const visits = patient.visits;
        const payments = patient.payments;
        const invoices = patient.invoices;

        // Skip patients with no visits
        if (visits.length === 0) return null;

        // Calculate total fees from VisitFee table
        let totalFeesFromVisits = 0;
        const paymentMethodCounts: { [key: string]: number } = {};
        
        visits.forEach(visit => {
          // Sum fees from VisitFee table
          const visitTotal = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
          totalFeesFromVisits += visitTotal;
          
          if (visit.paidBy) {
            paymentMethodCounts[visit.paidBy] = (paymentMethodCounts[visit.paidBy] || 0) + 1;
          }
        });

        // Also include invoice amounts
        const totalFeesFromInvoices = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);

        // Use the higher of the two to avoid double counting
        const totalFeesGenerated = Math.max(totalFeesFromVisits, totalFeesFromInvoices);

        // Calculate visit frequency
        const firstVisit = visits.length > 0 ? new Date(Math.min(...visits.map(v => new Date(v.visitDate).getTime()))) : new Date();
        const lastVisit = visits.length > 0 ? new Date(Math.max(...visits.map(v => new Date(v.visitDate).getTime()))) : new Date();
        const monthsDiff = Math.max(1, (lastVisit.getTime() - firstVisit.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const visitsPerMonth = visits.length / monthsDiff;
        
        let visitFrequency: 'High' | 'Medium' | 'Low';
        if (visitsPerMonth >= 2) visitFrequency = 'High';
        else if (visitsPerMonth >= 0.5) visitFrequency = 'Medium';
        else visitFrequency = 'Low';

        // Monthly breakdown
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
          .slice(-12) // Last 12 months
          .map(([month, data]) => ({
            month,
            visits: data.visits,
            fees: data.fees,
          }));

        // Recent visits (last 5)
        const recentVisits = visits.slice(0, 5).map(visit => {
          const visitFees = visit.fees.reduce((sum, fee) => sum + fee.total, 0);
          return {
            id: visit.id,
            visitDate: visit.visitDate.toISOString(),
            visitType: visit.visitType,
            fees: visitFees,
            paidBy: visit.paidBy || undefined,
          };
        });

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
      .filter((analytics): analytics is NonNullable<typeof analytics> => analytics !== null);
    
    // Calculate summary statistics
    const summary = {
      totalPatients: analyticsData.length,
      totalVisitsAll: analyticsData.reduce((sum, p) => sum + p.totalVisits, 0),
      totalRevenueAll: analyticsData.reduce((sum, p) => sum + p.totalFeesGenerated, 0),
      averageVisitsPerPatient: analyticsData.length > 0 ? analyticsData.reduce((sum, p) => sum + p.totalVisits, 0) / analyticsData.length : 0,
      averageRevenuePerPatient: analyticsData.length > 0 ? analyticsData.reduce((sum, p) => sum + p.totalFeesGenerated, 0) / analyticsData.length : 0,
      frequencyDistribution: {
        high: analyticsData.filter(p => p.visitFrequency === 'High').length,
        medium: analyticsData.filter(p => p.visitFrequency === 'Medium').length,
        low: analyticsData.filter(p => p.visitFrequency === 'Low').length,
      },
    };
    
    // Store in cache
    const cacheData = {
      data: analyticsData,
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
      totalPatients: analyticsData.length,
      calculationTime: `${calculationTime}ms`,
    });
    
    return { success: true, calculationTime, totalPatients: analyticsData.length };
  } catch (error) {
    logger.error('Analytics calculation failed', error);
    throw error;
  }
}
