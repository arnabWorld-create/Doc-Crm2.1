import prisma from '@/lib/prisma';
import {
  Users, Calendar, TrendingUp, Activity,
  UserCheck, Clock, AlertCircle, CheckCircle, Stethoscope,
} from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

// Lazy-load Recharts components (client-only)
const WeeklyRegistrationsChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.WeeklyRegistrationsChart })),
  { ssr: false }
);
const GenderPieChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.GenderPieChart })),
  { ssr: false }
);
const AgeDistributionChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.AgeDistributionChart })),
  { ssr: false }
);
const AppointmentTypesChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.AppointmentTypesChart })),
  { ssr: false }
);
const TopConditionsChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.TopConditionsChart })),
  { ssr: false }
);
const TopMedicinesChart = nextDynamic(
  () => import('@/components/AnalyticsCharts').then((m) => ({ default: m.TopMedicinesChart })),
  { ssr: false }
);

// ─── Cached medical analysis ─────────────────────────────────────────────────
const getCachedMedicalAnalysis = unstable_cache(
  async () => {
    const visitsWithData = await prisma.visit.findMany({
      select: { signs: true, medicines: true },
      where: { OR: [{ signs: { not: null } }, { medicines: { not: null } }] },
      orderBy: { visitDate: 'desc' },
      take: 500,
    });

    const { detectConditions, extractMedicines, groupMedicines } = await import('@/lib/medicalData');

    const conditionCount: Record<string, number> = {};
    visitsWithData.forEach((visit) => {
      if (visit.signs) {
        detectConditions(visit.signs).forEach((c) => {
          conditionCount[c] = (conditionCount[c] || 0) + 1;
        });
      }
    });

    const allMedicines: string[] = [];
    visitsWithData.forEach((visit) => {
      if (visit.medicines) allMedicines.push(...extractMedicines(visit.medicines));
    });

    const medicineCount = groupMedicines(allMedicines);

    const topConditions = Object.entries(conditionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topMedicines = Object.entries(medicineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return { topConditions, topMedicines };
  },
  ['medical-analysis'],
  { revalidate: 300, tags: ['medical-analysis'] }
);

// ─── Page ────────────────────────────────────────────────────────────────────
const AnalyticsPage = async () => {
  const today = new Date();
  const startOfMonth     = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfWeek      = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(today); todayEnd.setHours(23, 59, 59, 999);

  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(today.getDate() - 7 * 7);
  eightWeeksAgo.setHours(0, 0, 0, 0);

  // ── Patient stats ──────────────────────────────────────────────────────────
  const patientStats = await prisma.$queryRaw<Array<{
    total: bigint; this_month: bigint; last_month: bigint; this_week: bigint;
    with_records: bigint; male: bigint; female: bigint; other: bigint;
    age_0_18: bigint; age_19_35: bigint; age_36_50: bigint;
    age_51_65: bigint; age_65_plus: bigint;
  }>>`
    SELECT
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfMonth})::bigint as this_month,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfLastMonth} AND "createdAt" <= ${endOfLastMonth})::bigint as last_month,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfWeek})::bigint as this_week,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM visits WHERE visits."patientId" = patients.id AND signs IS NOT NULL))::bigint as with_records,
      COUNT(*) FILTER (WHERE gender = 'Male')::bigint as male,
      COUNT(*) FILTER (WHERE gender = 'Female')::bigint as female,
      COUNT(*) FILTER (WHERE gender = 'Other')::bigint as other,
      COUNT(*) FILTER (WHERE age IS NOT NULL AND age <= 18)::bigint as age_0_18,
      COUNT(*) FILTER (WHERE age IS NOT NULL AND age > 18 AND age <= 35)::bigint as age_19_35,
      COUNT(*) FILTER (WHERE age IS NOT NULL AND age > 35 AND age <= 50)::bigint as age_36_50,
      COUNT(*) FILTER (WHERE age IS NOT NULL AND age > 50 AND age <= 65)::bigint as age_51_65,
      COUNT(*) FILTER (WHERE age IS NOT NULL AND age > 65)::bigint as age_65_plus
    FROM patients
  `;

  const s = patientStats[0];
  const totalPatients              = Number(s.total);
  const patientsThisMonth          = Number(s.this_month);
  const patientsLastMonth          = Number(s.last_month);
  const patientsThisWeek           = Number(s.this_week);
  const patientsWithCompleteRecords = Number(s.with_records);
  const maleCount                  = Number(s.male);
  const femaleCount                = Number(s.female);
  const otherCount                 = Number(s.other);

  const ageGroups = {
    '0-18':  Number(s.age_0_18),
    '19-35': Number(s.age_19_35),
    '36-50': Number(s.age_36_50),
    '51-65': Number(s.age_51_65),
    '65+':   Number(s.age_65_plus),
  };

  // ── Weekly patient data ────────────────────────────────────────────────────
  const recentPatients = await prisma.patient.findMany({
    select: { createdAt: true },
    where: { createdAt: { gte: eightWeeksAgo } },
    orderBy: { createdAt: 'asc' },
  });

  // ── Visit stats ────────────────────────────────────────────────────────────
  const visitStats = await prisma.$queryRaw<Array<{
    today: bigint; upcoming: bigint; this_week: bigint; overdue: bigint;
  }>>`
    SELECT
      COUNT(*) FILTER (WHERE "visitDate" >= ${todayStart} AND "visitDate" < ${todayEnd})::bigint as today,
      COUNT(*) FILTER (WHERE "followUpDate" >= ${today})::bigint as upcoming,
      COUNT(*) FILTER (WHERE "followUpDate" >= ${startOfWeek} AND "followUpDate" < ${new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)})::bigint as this_week,
      COUNT(*) FILTER (WHERE "followUpDate" < ${today})::bigint as overdue
    FROM visits
  `;

  const v = visitStats[0];
  const consultationsToday = Number(v.today);
  const upcomingFollowUps  = Number(v.upcoming);
  const followUpsThisWeek  = Number(v.this_week);
  const overdueFollowUps   = Number(v.overdue);

  // ── Appointment stats ──────────────────────────────────────────────────────
  const appointmentStats = await prisma.$queryRaw<Array<{
    total: bigint; with_patient: bigint; without_patient: bigint;
  }>>`
    SELECT
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE "patientId" IS NOT NULL)::bigint as with_patient,
      COUNT(*) FILTER (WHERE "patientId" IS NULL)::bigint as without_patient
    FROM appointments
  `;

  const a = appointmentStats[0];
  const totalAppointments       = Number(a.total);
  const oldPatientAppointments  = Number(a.with_patient);
  const newPatientAppointments  = Number(a.without_patient);

  // ── Derived values ─────────────────────────────────────────────────────────
  const avgPatientsPerDay = (patientsThisMonth / today.getDate()).toFixed(1);
  const growthRate = patientsLastMonth > 0
    ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth * 100).toFixed(1)
    : '0';
  const completionRate = totalPatients > 0
    ? ((patientsWithCompleteRecords / totalPatients) * 100).toFixed(1)
    : '0';

  const { topConditions, topMedicines } = await getCachedMedicalAnalysis();

  // ── Build weekly chart data ────────────────────────────────────────────────
  const weeksData: Array<{ label: string; count: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const wStart = new Date(today);
    wStart.setDate(today.getDate() - i * 7 - today.getDay());
    wStart.setHours(0, 0, 0, 0);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 7);
    const count = recentPatients.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= wStart && d < wEnd;
    }).length;
    weeksData.push({ label: `W${8 - i}`, count });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Real-time insights and performance metrics for DoXcia"
      />

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="teal"
          title="Total Patients Registered"
          value={totalPatients}
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
          badge={<span className="bg-white/20 px-2 py-0.5 rounded text-xs">All Time</span>}
        />
        <StatCard
          variant="white-teal"
          title="New Patients This Month"
          value={patientsThisMonth}
          icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
          badge={
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(growthRate) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
            </span>
          }
        />
        <StatCard
          variant="yellow"
          title="New Patients This Week"
          value={patientsThisWeek}
          icon={<Calendar className="h-5 w-5 sm:h-6 sm:w-6" />}
          badge={<span className="bg-white/20 px-2 py-0.5 rounded text-xs">This Week</span>}
        />
        <StatCard
          variant="white-red"
          title="Consultations Today"
          value={consultationsToday}
          icon={<Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />}
          badge={<span className="bg-red-50 text-brand-red px-2 py-0.5 rounded text-xs">Today</span>}
        />
      </div>

      {/* ── Follow-up Tracking ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          variant="white-teal"
          title="Follow-ups This Week"
          value={followUpsThisWeek}
          icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatCard
          variant="white-yellow"
          title="Total Upcoming Follow-ups"
          value={upcomingFollowUps}
          icon={<Calendar className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatCard
          variant="white-red"
          title="Overdue Follow-ups"
          value={overdueFollowUps}
          icon={<AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </div>

      {/* ── Charts: Appointments + Weekly Registrations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Appointment Types donut */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-brand-teal">Appointment Types</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <UserCheck className="h-4 w-4 text-brand-teal" />
            </div>
          </div>
          <AppointmentTypesChart
            data={{ oldPatientAppointments, newPatientAppointments, totalAppointments }}
          />
          {totalAppointments > 0 && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Total: <span className="font-semibold text-gray-600">{totalAppointments}</span> appointments
            </p>
          )}
        </div>

        {/* Weekly registrations bar chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-brand-teal">Weekly Patient Registrations</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-brand-teal" />
            </div>
          </div>
          <WeeklyRegistrationsChart data={weeksData} />
          <p className="text-xs text-center text-gray-400 mt-2">
            8-week avg:{' '}
            <span className="font-semibold text-brand-teal">
              {(weeksData.reduce((s, w) => s + w.count, 0) / weeksData.length).toFixed(1)} patients/week
            </span>
          </p>
        </div>
      </div>

      {/* ── Performance Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Record Completion Rate */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Record Completion Rate</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-teal">{completionRate}%</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {patientsWithCompleteRecords} of {totalPatients} patients
              </p>
            </div>
            <Activity className="h-8 w-8 text-brand-teal/20" />
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-brand-teal to-brand-teal/70 h-3 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Patients with consultation, signs &amp; treatment recorded</p>
        </div>

        {/* Average Daily Patients */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Average Daily Patients</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-yellow">{avgPatientsPerDay}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">patients per day</p>
            </div>
            <TrendingUp className="h-8 w-8 text-brand-yellow/20" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Based on {patientsThisMonth} patients in {today.getDate()} days
            </p>
          </div>
        </div>

        {/* Follow-up Compliance */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Follow-up Compliance</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-red">{overdueFollowUps}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">require attention</p>
            </div>
            <Clock className="h-8 w-8 text-brand-red/20" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {upcomingFollowUps} upcoming appointments scheduled
            </p>
          </div>
        </div>
      </div>

      {/* ── Demographics Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gender Distribution pie */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Gender Distribution</h3>
          <GenderPieChart
            data={{ maleCount, femaleCount, otherCount, totalPatients }}
          />
        </div>

        {/* Age Distribution bar */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Age Distribution</h3>
          <AgeDistributionChart data={ageGroups} />
        </div>
      </div>

      {/* ── Medical Analytics Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Common Conditions */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-brand-teal">Common Conditions</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <Activity className="h-4 w-4 text-brand-teal" />
            </div>
          </div>
          <TopConditionsChart data={topConditions} />
        </div>

        {/* Top Prescribed Medicines */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-brand-red">Top Prescribed Medicines</h3>
            <div className="p-2 bg-brand-red/10 rounded-lg">
              <Stethoscope className="h-4 w-4 text-brand-red" />
            </div>
          </div>
          <TopMedicinesChart data={topMedicines} />
        </div>
      </div>

      {/* ── Actionable Insights ── */}
      <div className="bg-gradient-to-br from-brand-teal/5 via-white to-brand-yellow/5 p-4 sm:p-6 rounded-xl border border-brand-teal/20">
        <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Actionable Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">

          {/* Growth */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">Patient Growth Trend</p>
                <p className="text-gray-600">
                  {Number(growthRate) >= 0
                    ? <>Your patient base has{' '}
                        <span className="font-semibold text-green-600">grown by {growthRate}%</span> this month.{' '}
                        {Number(growthRate) > 10 ? 'Excellent growth! Consider expanding clinic hours.' : 'Steady growth maintained.'}</>
                    : <>Registrations have{' '}
                        <span className="font-semibold text-brand-red">decreased by {Math.abs(Number(growthRate))}%</span>. Consider reviewing marketing strategies.</>}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up alert */}
          <div className={`bg-white p-4 rounded-lg border-l-4 shadow-sm ${overdueFollowUps > 0 ? 'border-brand-red' : 'border-brand-yellow'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${overdueFollowUps > 0 ? 'bg-brand-red/10' : 'bg-brand-yellow/10'}`}>
                <AlertCircle className={`h-4 w-4 ${overdueFollowUps > 0 ? 'text-brand-red' : 'text-brand-yellow'}`} />
              </div>
              <div>
                <p className={`font-bold mb-1 ${overdueFollowUps > 0 ? 'text-brand-red' : 'text-brand-yellow'}`}>
                  {overdueFollowUps > 0 ? 'Urgent: Follow-up Required' : 'Follow-up Status'}
                </p>
                <p className="text-gray-600">
                  {overdueFollowUps > 0
                    ? <><span className="font-semibold">{overdueFollowUps} patient{overdueFollowUps !== 1 ? 's have' : ' has'}</span> missed follow-up appointments.</>
                    : <>All follow-ups on track! {upcomingFollowUps} appointment{upcomingFollowUps !== 1 ? 's' : ''} scheduled.</>}
                </p>
              </div>
            </div>
          </div>

          {/* Record completion */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-yellow shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-yellow/10 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-bold text-brand-yellow mb-1">Record Completion</p>
                <p className="text-gray-600">
                  {Number(completionRate) >= 80
                    ? <>Excellent! <span className="font-semibold">{completionRate}%</span> of patient records are complete.</>
                    : Number(completionRate) >= 60
                    ? <>Good at <span className="font-semibold">{completionRate}%</span>. {totalPatients - patientsWithCompleteRecords} records still need completion.</>
                    : <>Only <span className="font-semibold">{completionRate}%</span> complete. Focus on documenting consultations and treatments.</>}
                </p>
              </div>
            </div>
          </div>

          {/* Daily workload */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <Activity className="h-4 w-4 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">Daily Workload</p>
                <p className="text-gray-600">
                  Averaging <span className="font-semibold">{avgPatientsPerDay} patients/day</span> this month.
                  {Number(avgPatientsPerDay) > 10 ? ' High volume — ensure adequate staffing.' : ' Manageable patient flow.'}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly activity */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">This Week&apos;s Activity</p>
                <p className="text-gray-600">
                  <span className="font-semibold">{patientsThisWeek} new patient{patientsThisWeek !== 1 ? 's' : ''}</span> registered and{' '}
                  <span className="font-semibold">{followUpsThisWeek} follow-up{followUpsThisWeek !== 1 ? 's' : ''}</span> scheduled.
                  {consultationsToday > 0 && <> {consultationsToday} consultation{consultationsToday !== 1 ? 's' : ''} today.</>}
                </p>
              </div>
            </div>
          </div>

          {/* Demographics insight */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-yellow shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-yellow/10 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-bold text-brand-yellow mb-1">Patient Demographics</p>
                <p className="text-gray-600">
                  Primary group: <span className="font-semibold">{maleCount > femaleCount ? 'Male' : 'Female'}</span>{' '}
                  ({Math.max(maleCount, femaleCount)} patients).
                  {totalPatients > 0 && (
                    <> Ratio: {((maleCount / totalPatients) * 100).toFixed(0)}% Male,{' '}
                    {((femaleCount / totalPatients) * 100).toFixed(0)}% Female.</>
                  )}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
