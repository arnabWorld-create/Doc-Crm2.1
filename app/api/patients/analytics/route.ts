import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { requireAuth } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { extractFeesFromNotes } from '@/lib/fee-utils';

export const dynamic = 'force-dynamic';

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
  visitFrequency: 'High' | 'Medium' | 'Low'; // Based on visits per month
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

// GET patient visit analytics
export const GET = withMiddleware(
  async (request: NextRequest) => {
    try {
      const { error, user } = await requireAuth(request);
      if (error) throw error;

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const sortBy = searchParams.get('sortBy') || 'totalFeesGenerated';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const minVisits = parseInt(searchParams.get('minVisits') || '1');
      const timeRange = searchParams.get('timeRange') || 'all';
      const skip = (page - 1) * limit;

      // Calculate date filter based on time range
      let dateFilter: Date | undefined;
      const now = new Date();
      switch (timeRange) {
        case '30d':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          dateFilter = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = undefined;
      }

      // Fetch patients with their visits and payment data
      const patients = await prisma.patient.findMany({
        include: {
          visits: {
            where: dateFilter ? { visitDate: { gte: dateFilter } } : undefined,
            select: {
              id: true,
              visitDate: true,
              visitType: true,
              notes: true,
              paidBy: true,
            },
            orderBy: { visitDate: 'desc' },
          },
          payments: {
            where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
            },
          },
          invoices: {
            where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
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

          // Skip patients with no visits or below minimum visits threshold
          if (visits.length < minVisits) return null;

          // Calculate total fees from visit notes
          let totalFeesFromVisits = 0;
          const paymentMethodCounts: { [key: string]: number } = {};
          
          visits.forEach(visit => {
            const feesData = extractFeesFromNotes(visit.notes);
            if (feesData) {
              totalFeesFromVisits += feesData.total;
            }
            
            if (visit.paidBy) {
              paymentMethodCounts[visit.paidBy] = (paymentMethodCounts[visit.paidBy] || 0) + 1;
            }
          });

          // Also include invoice amounts (in case some fees are tracked via invoices)
          const totalFeesFromInvoices = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

          // Use the higher of the two (visits fees or invoice fees) to avoid double counting
          const totalFeesGenerated = Math.max(totalFeesFromVisits, totalFeesFromInvoices);

          // Calculate visit frequency (visits per month)
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
            
            const feesData = extractFeesFromNotes(visit.notes);
            const visitFees = feesData ? feesData.total : 0;
            
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
            const feesData = extractFeesFromNotes(visit.notes);
            return {
              id: visit.id,
              visitDate: visit.visitDate.toISOString(),
              visitType: visit.visitType,
              fees: feesData ? feesData.total : 0,
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

      // Sort the results
      analyticsData.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'totalVisits':
            aValue = a.totalVisits;
            bValue = b.totalVisits;
            break;
          case 'totalFeesGenerated':
            aValue = a.totalFeesGenerated;
            bValue = b.totalFeesGenerated;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'averageFeePerVisit':
            aValue = a.averageFeePerVisit;
            bValue = b.averageFeePerVisit;
            break;
          default:
            aValue = a.totalFeesGenerated;
            bValue = b.totalFeesGenerated;
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      // Apply pagination
      const paginatedData = analyticsData.slice(skip, skip + limit);
      const total = analyticsData.length;

      // Calculate summary statistics
      const summary = {
        totalPatients: analyticsData.length,
        totalVisitsAll: analyticsData.reduce((sum, p) => sum + p.totalVisits, 0),
        totalRevenueAll: analyticsData.reduce((sum, p) => sum + p.totalFeesGenerated, 0),
        averageVisitsPerPatient: analyticsData.length > 0 ? analyticsData.reduce((sum, p) => sum + p.totalVisits, 0) / analyticsData.length : 0,
        averageRevenuePerPatient: analyticsData.length > 0 ? analyticsData.reduce((sum, p) => sum + p.totalFeesGenerated, 0) / analyticsData.length : 0,
        topRevenuePatient: analyticsData.length > 0 ? analyticsData[0] : null,
        frequencyDistribution: {
          high: analyticsData.filter(p => p.visitFrequency === 'High').length,
          medium: analyticsData.filter(p => p.visitFrequency === 'Medium').length,
          low: analyticsData.filter(p => p.visitFrequency === 'Low').length,
        },
      };

      logger.info('Fetched patient analytics', {
        totalPatients: total,
        timeRange,
        sortBy,
        sortOrder,
        minVisits,
      });

      return successResponse(
        {
          data: paginatedData,
          summary,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
          filters: {
            timeRange,
            sortBy,
            sortOrder,
            minVisits,
          },
        },
        200,
        request
      );
    } catch (error) {
      logger.error('Patient analytics error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);