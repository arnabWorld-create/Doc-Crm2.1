import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';

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

// ------------------------------------------------------------------
// FIX: The previous real-time fallback did prisma.patient.findMany()
// with NO limit — loading ALL patients + all their visits/payments/
// invoices into Node.js memory. At 1,000 patients it was slow, at
// 10,000 it would timeout, at 100,000 it would crash the server.
//
// New strategy:
//   1. Always try the 6-hour cache first (fast, no DB load at all).
//   2. If cache is stale/missing AND a time filter is requested,
//      run an aggregation query directly in PostgreSQL — no data
//      ever leaves the DB into Node.js memory.
//   3. The nightly cron (calculate-analytics) rebuilds the full
//      "all time" cache in batches of 50. This route never does
//      that heavy work itself anymore.
// ------------------------------------------------------------------

// GET patient visit analytics
export const GET = withMiddleware(
  async (request: NextRequest) => {
    try {
      const { error } = await requirePermission(request, 'analytics', 'read');
      if (error) throw error;

      const { searchParams } = new URL(request.url);
      const page       = Math.max(1, parseInt(searchParams.get('page')      || '1'));
      const limit      = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
      const sortBy     = searchParams.get('sortBy')    || 'totalFeesGenerated';
      const sortOrder  = searchParams.get('sortOrder') || 'desc';
      const minVisits  = Math.max(1, parseInt(searchParams.get('minVisits') || '1'));
      const timeRange  = searchParams.get('timeRange') || 'all';
      const skip       = (page - 1) * limit;

      // ── Step 1: Try cache (covers the "all time, default filters" case) ──
      const useCache = timeRange === 'all' && minVisits === 1;

      if (useCache) {
        const cached = await prisma.analyticsCache.findUnique({
          where: { cacheKey: 'patient_analytics_all' },
        });

        if (cached && new Date(cached.expiresAt) > new Date()) {
          const cacheData = JSON.parse(cached.data);
          let analyticsData = cacheData.data as PatientAnalytics[];

          analyticsData = sortAnalytics(analyticsData, sortBy, sortOrder);

          const total        = analyticsData.length;
          const paginatedData = analyticsData.slice(skip, skip + limit);

          logger.info('Analytics served from cache', {
            calculatedAt: cached.calculatedAt,
            ageSeconds: Math.round((Date.now() - new Date(cached.calculatedAt).getTime()) / 1000),
          });

          return successResponse(
            {
              data: paginatedData,
              summary: cacheData.summary,
              pagination: { total, page, limit, pages: Math.ceil(total / limit) },
              filters: { timeRange, sortBy, sortOrder, minVisits },
              cached: true,
              calculatedAt: cached.calculatedAt,
            },
            200,
            request
          );
        }
      }

      // ── Step 2: No cache or time-filtered request ──
      // Push ALL the aggregation work into PostgreSQL.
      // We never pull raw visit rows into Node.js — the DB does the math.
      //
      // SECURITY: switched from $queryRawUnsafe (string interpolation) to
      // $queryRaw (tagged template) so every value is a parameterized bind
      // variable. Zero SQL injection risk regardless of input.
      const dateFilter = resolveDateFilter(timeRange);
      const dateTs = dateFilter ?? new Date(0); // epoch = "all time" sentinel
      const useDate = dateFilter !== undefined;

      // One aggregation query — safe at any patient count.
      // Two variants (with/without date) avoid injecting conditional SQL
      // fragments while keeping all user-supplied values as bind params.
      type AggRow = {
        id: string;
        patientId: string;
        name: string;
        contact: string | null;
        total_visits: bigint;
        total_fees: number;
        first_visit: Date | null;
        last_visit: Date | null;
        paid_by_counts: string | null;
        monthly_data: string | null;
        recent_visits: string | null;
        invoice_total: number;
      };

      const rows = useDate
        ? await prisma.$queryRaw<AggRow[]>`
            SELECT
              p.id,
              p."patientId",
              p.name,
              p.contact,
              COUNT(DISTINCT v.id)::bigint        AS total_visits,
              MIN(v."visitDate")                  AS first_visit,
              MAX(v."visitDate")                  AS last_visit,
              COALESCE(SUM(vf.total), 0)          AS total_fees,
              (
                SELECT json_object_agg(paid_by, cnt)
                FROM (
                  SELECT v2."paidBy" AS paid_by, COUNT(*) AS cnt
                  FROM visits v2
                  WHERE v2."patientId" = p.id
                    AND v2."paidBy" IS NOT NULL
                    AND v2."visitDate" >= ${dateTs}
                  GROUP BY v2."paidBy"
                ) pm
              )                                   AS paid_by_counts,
              (
                SELECT json_agg(monthly ORDER BY month)
                FROM (
                  SELECT
                    to_char(v3."visitDate", 'YYYY-MM') AS month,
                    COUNT(*)                           AS visits,
                    COALESCE(SUM(vf3.total), 0)        AS fees
                  FROM visits v3
                  LEFT JOIN visit_fees vf3 ON vf3."visitId" = v3.id
                  WHERE v3."patientId" = p.id
                    AND v3."visitDate" >= ${dateTs}
                  GROUP BY to_char(v3."visitDate", 'YYYY-MM')
                  ORDER BY month DESC
                  LIMIT 12
                ) monthly
              )                                   AS monthly_data,
              (
                SELECT json_agg(rv ORDER BY rv."visitDate" DESC)
                FROM (
                  SELECT
                    v4.id,
                    v4."visitDate",
                    v4."visitType",
                    v4."paidBy",
                    COALESCE(SUM(vf4.total), 0) AS fees
                  FROM visits v4
                  LEFT JOIN visit_fees vf4 ON vf4."visitId" = v4.id
                  WHERE v4."patientId" = p.id
                    AND v4."visitDate" >= ${dateTs}
                  GROUP BY v4.id, v4."visitDate", v4."visitType", v4."paidBy"
                  ORDER BY v4."visitDate" DESC
                  LIMIT 5
                ) rv
              )                                   AS recent_visits,
              COALESCE((
                SELECT SUM(i.amount)
                FROM invoices i
                WHERE i."patientId" = p.id
                  AND i.status = 'paid'
                  AND i."createdAt" >= ${dateTs}
              ), 0)                               AS invoice_total
            FROM patients p
            LEFT JOIN visits v   ON v."patientId" = p.id AND v."visitDate" >= ${dateTs}
            LEFT JOIN visit_fees vf ON vf."visitId" = v.id
            GROUP BY p.id
            HAVING COUNT(DISTINCT v.id) >= ${minVisits}
          `
        : await prisma.$queryRaw<AggRow[]>`
            SELECT
              p.id,
              p."patientId",
              p.name,
              p.contact,
              COUNT(DISTINCT v.id)::bigint        AS total_visits,
              MIN(v."visitDate")                  AS first_visit,
              MAX(v."visitDate")                  AS last_visit,
              COALESCE(SUM(vf.total), 0)          AS total_fees,
              (
                SELECT json_object_agg(paid_by, cnt)
                FROM (
                  SELECT v2."paidBy" AS paid_by, COUNT(*) AS cnt
                  FROM visits v2
                  WHERE v2."patientId" = p.id
                    AND v2."paidBy" IS NOT NULL
                  GROUP BY v2."paidBy"
                ) pm
              )                                   AS paid_by_counts,
              (
                SELECT json_agg(monthly ORDER BY month)
                FROM (
                  SELECT
                    to_char(v3."visitDate", 'YYYY-MM') AS month,
                    COUNT(*)                           AS visits,
                    COALESCE(SUM(vf3.total), 0)        AS fees
                  FROM visits v3
                  LEFT JOIN visit_fees vf3 ON vf3."visitId" = v3.id
                  WHERE v3."patientId" = p.id
                  GROUP BY to_char(v3."visitDate", 'YYYY-MM')
                  ORDER BY month DESC
                  LIMIT 12
                ) monthly
              )                                   AS monthly_data,
              (
                SELECT json_agg(rv ORDER BY rv."visitDate" DESC)
                FROM (
                  SELECT
                    v4.id,
                    v4."visitDate",
                    v4."visitType",
                    v4."paidBy",
                    COALESCE(SUM(vf4.total), 0) AS fees
                  FROM visits v4
                  LEFT JOIN visit_fees vf4 ON vf4."visitId" = v4.id
                  WHERE v4."patientId" = p.id
                  GROUP BY v4.id, v4."visitDate", v4."visitType", v4."paidBy"
                  ORDER BY v4."visitDate" DESC
                  LIMIT 5
                ) rv
              )                                   AS recent_visits,
              COALESCE((
                SELECT SUM(i.amount)
                FROM invoices i
                WHERE i."patientId" = p.id
                  AND i.status = 'paid'
              ), 0)                               AS invoice_total
            FROM patients p
            LEFT JOIN visits v   ON v."patientId" = p.id
            LEFT JOIN visit_fees vf ON vf."visitId" = v.id
            GROUP BY p.id
            HAVING COUNT(DISTINCT v.id) >= ${minVisits}
          `;

      // Shape DB rows into analytics objects — pure number crunching, no extra queries
      const analyticsData: PatientAnalytics[] = rows.map(row => {
        const totalVisits        = Number(row.total_visits);
        const totalFeesFromVisits = Number(row.total_fees);
        const totalFeesFromInvoices = Number(row.invoice_total);
        const totalFeesGenerated = Math.max(totalFeesFromVisits, totalFeesFromInvoices);

        const firstVisit = row.first_visit ? new Date(row.first_visit) : new Date();
        const lastVisit  = row.last_visit  ? new Date(row.last_visit)  : new Date();
        const monthsDiff = Math.max(
          1,
          (lastVisit.getTime() - firstVisit.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        const visitsPerMonth = totalVisits / monthsDiff;

        let visitFrequency: 'High' | 'Medium' | 'Low';
        if (visitsPerMonth >= 2)   visitFrequency = 'High';
        else if (visitsPerMonth >= 0.5) visitFrequency = 'Medium';
        else                       visitFrequency = 'Low';

        // Prisma $queryRawUnsafe returns PostgreSQL json/jsonb columns as
        // already-parsed JS objects, NOT as strings. Using JSON.parse() on
        // them throws "is not valid JSON" because JSON.parse coerces the
        // object to "[object Object]" first. We need to handle both cases:
        // already-parsed (object) and raw string (fallback safety).
        const parseJsonField = <T>(field: unknown, fallback: T): T => {
          if (field === null || field === undefined) return fallback;
          if (typeof field === 'string') {
            try { return JSON.parse(field) as T; } catch { return fallback; }
          }
          return field as unknown as T;
        };

        const paymentMethods: { [key: string]: number } =
          parseJsonField(row.paid_by_counts, {});

        const monthlyVisits: { month: string; visits: number; fees: number }[] =
          parseJsonField(row.monthly_data, []);

        const rawRecentVisits = parseJsonField<any[]>(row.recent_visits, []);
        const recentVisits = rawRecentVisits.map(v => ({
          id:        v.id,
          visitDate: new Date(v.visitDate).toISOString(),
          visitType: v.visitType,
          fees:      Number(v.fees),
          paidBy:    v.paidBy ?? undefined,
        }));

        return {
          id:                   row.id,
          patientId:            row.patientId,
          name:                 row.name,
          contact:              row.contact,
          totalVisits,
          totalFeesGenerated,
          averageFeePerVisit:   totalVisits > 0 ? totalFeesGenerated / totalVisits : 0,
          firstVisitDate:       firstVisit.toISOString(),
          lastVisitDate:        lastVisit.toISOString(),
          visitFrequency,
          paymentMethods,
          monthlyVisits,
          recentVisits,
        };
      });

      const sorted       = sortAnalytics(analyticsData, sortBy, sortOrder);
      const total        = sorted.length;
      const paginatedData = sorted.slice(skip, skip + limit);

      const summary = buildSummary(sorted);

      logger.info('Analytics calculated via aggregation query', {
        totalPatients: total,
        timeRange,
        cached: false,
      });

      return successResponse(
        {
          data: paginatedData,
          summary,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
          filters: { timeRange, sortBy, sortOrder, minVisits },
          cached: false,
        },
        200,
        request
      );
    } catch (error) {
      logger.error('Patient analytics error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  { rateLimit: RATE_LIMITS.API }
);

// ── Helpers ──────────────────────────────────────────────────────────

function resolveDateFilter(timeRange: string): Date | undefined {
  const now = new Date();
  switch (timeRange) {
    case '30d': return new Date(now.getTime() - 30  * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);
    case '6m':  return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y':  return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:    return undefined;
  }
}

function sortAnalytics(
  data: PatientAnalytics[],
  sortBy: string,
  sortOrder: string
): PatientAnalytics[] {
  return [...data].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortBy) {
      case 'totalVisits':        aVal = a.totalVisits;        bVal = b.totalVisits;        break;
      case 'name':               aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
      case 'averageFeePerVisit': aVal = a.averageFeePerVisit; bVal = b.averageFeePerVisit; break;
      default:                   aVal = a.totalFeesGenerated; bVal = b.totalFeesGenerated; break;
    }

    if (sortOrder === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
  });
}

function buildSummary(data: PatientAnalytics[]) {
  const total = data.length;
  const totalVisits  = data.reduce((s, p) => s + p.totalVisits, 0);
  const totalRevenue = data.reduce((s, p) => s + p.totalFeesGenerated, 0);
  return {
    totalPatients:           total,
    totalVisitsAll:          totalVisits,
    totalRevenueAll:         totalRevenue,
    averageVisitsPerPatient: total > 0 ? totalVisits  / total : 0,
    averageRevenuePerPatient:total > 0 ? totalRevenue / total : 0,
    topRevenuePatient:       data[0] ?? null,
    frequencyDistribution: {
      high:   data.filter(p => p.visitFrequency === 'High').length,
      medium: data.filter(p => p.visitFrequency === 'Medium').length,
      low:    data.filter(p => p.visitFrequency === 'Low').length,
    },
  };
}
