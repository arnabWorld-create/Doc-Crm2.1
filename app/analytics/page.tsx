import prisma from '@/lib/prisma';
import { Users, Calendar, TrendingUp, Activity, UserCheck, Clock, AlertCircle, CheckCircle, Stethoscope } from 'lucide-react';
import { unstable_cache } from 'next/cache';

// Force dynamic rendering - don't try to pre-render at build time
export const dynamic = 'force-dynamic';

// Cache analytics for 5 minutes (300 seconds) - balance between freshness and performance
export const revalidate = 300;

// Cache the medical data analysis separately
const getCachedMedicalAnalysis = unstable_cache(
  async () => {
    // Get visits with signs/symptoms and medicines (limit to last 500 for performance)
    const visitsWithData = await prisma.visit.findMany({
      select: {
        signs: true,
        medicines: true,
      },
      where: {
        OR: [
          { signs: { not: null } },
          { medicines: { not: null } },
        ],
      },
      orderBy: { visitDate: 'desc' },
      take: 500,
    });

    // Import improved detection functions
    const { detectConditions, extractMedicines, groupMedicines } = await import('@/lib/medicalData');

    // Analyze common conditions/diseases from signs
    const conditionCount: { [key: string]: number } = {};
    visitsWithData.forEach((visit) => {
      if (visit.signs) {
        const detectedConditions = detectConditions(visit.signs);
        detectedConditions.forEach((condition) => {
          conditionCount[condition] = (conditionCount[condition] || 0) + 1;
        });
      }
    });

    // Analyze common medicines
    const allMedicines: string[] = [];
    visitsWithData.forEach((visit) => {
      if (visit.medicines) {
        const medicines = extractMedicines(visit.medicines);
        allMedicines.push(...medicines);
      }
    });

    // Group similar medicines together
    const medicineCount = groupMedicines(allMedicines);

    // Get top 10 conditions and medicines
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
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['medical-analysis'],
  }
);

const AnalyticsPage = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // SUPER OPTIMIZED: Combine ALL patient queries into ONE with raw SQL
  const patientStats = await prisma.$queryRaw<Array<{
    total: bigint;
    this_month: bigint;
    last_month: bigint;
    this_week: bigint;
    with_records: bigint;
    male: bigint;
    female: bigint;
    other: bigint;
  }>>`
    SELECT 
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfMonth})::bigint as this_month,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfLastMonth} AND "createdAt" <= ${endOfLastMonth})::bigint as last_month,
      COUNT(*) FILTER (WHERE "createdAt" >= ${startOfWeek})::bigint as this_week,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM visits WHERE visits."patientId" = patients.id AND signs IS NOT NULL))::bigint as with_records,
      COUNT(*) FILTER (WHERE gender = 'Male')::bigint as male,
      COUNT(*) FILTER (WHERE gender = 'Female')::bigint as female,
      COUNT(*) FILTER (WHERE gender = 'Other')::bigint as other
    FROM patients
  `;

  const stats = patientStats[0];
  const totalPatients = Number(stats.total);
  const patientsThisMonth = Number(stats.this_month);
  const patientsLastMonth = Number(stats.last_month);
  const patientsThisWeek = Number(stats.this_week);
  const patientsWithCompleteRecords = Number(stats.with_records);
  const maleCount = Number(stats.male);
  const femaleCount = Number(stats.female);
  const otherCount = Number(stats.other);

  // SUPER OPTIMIZED: Combine ALL visit queries into ONE
  const visitStats = await prisma.$queryRaw<Array<{
    today: bigint;
    upcoming: bigint;
    this_week: bigint;
    overdue: bigint;
  }>>`
    SELECT 
      COUNT(*) FILTER (WHERE "visitDate" >= ${todayStart} AND "visitDate" < ${todayEnd})::bigint as today,
      COUNT(*) FILTER (WHERE "followUpDate" >= ${today})::bigint as upcoming,
      COUNT(*) FILTER (WHERE "followUpDate" >= ${startOfWeek} AND "followUpDate" < ${new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)})::bigint as this_week,
      COUNT(*) FILTER (WHERE "followUpDate" < ${today})::bigint as overdue
    FROM visits
  `;

  const vStats = visitStats[0];
  const consultationsToday = Number(vStats.today);
  const upcomingFollowUps = Number(vStats.upcoming);
  const followUpsThisWeek = Number(vStats.this_week);
  const overdueFollowUps = Number(vStats.overdue);

  // SUPER OPTIMIZED: Combine ALL appointment queries into ONE
  const appointmentStats = await prisma.$queryRaw<Array<{
    total: bigint;
    with_patient: bigint;
    without_patient: bigint;
  }>>`
    SELECT 
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE "patientId" IS NOT NULL)::bigint as with_patient,
      COUNT(*) FILTER (WHERE "patientId" IS NULL)::bigint as without_patient
    FROM appointments
  `;

  const aStats = appointmentStats[0];
  const totalAppointments = Number(aStats.total);
  const oldPatientAppointments = Number(aStats.with_patient);
  const newPatientAppointments = Number(aStats.without_patient);

  // Calculate average patients per day
  const avgPatientsPerDay = (patientsThisMonth / today.getDate()).toFixed(1);

  // Get cached medical analysis (conditions and medicines) - much faster!
  const { topConditions, topMedicines } = await getCachedMedicalAnalysis();

  // Age groups - fetch only age field (already optimized with single query)
  const patients = await prisma.patient.findMany({
    select: { age: true },
    where: { age: { not: null } },
  });

  const ageGroups = {
    '0-18': 0,
    '19-35': 0,
    '36-50': 0,
    '51-65': 0,
    '65+': 0,
  };

  patients.forEach((patient) => {
    if (patient.age) {
      if (patient.age <= 18) ageGroups['0-18']++;
      else if (patient.age <= 35) ageGroups['19-35']++;
      else if (patient.age <= 50) ageGroups['36-50']++;
      else if (patient.age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    }
  });

  const growthRate = patientsLastMonth > 0 
    ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth * 100).toFixed(1)
    : '0';

  const completionRate = totalPatients > 0 
    ? ((patientsWithCompleteRecords / totalPatients) * 100).toFixed(1)
    : '0';

  // Week on Week New Patient Registrations (last 8 weeks) - OPTIMIZED: Single query
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(today.getDate() - (7 * 7)); // 7 weeks ago
  eightWeeksAgo.setHours(0, 0, 0, 0);
  
  // Fetch all patients from last 8 weeks in ONE query
  const recentPatients = await prisma.patient.findMany({
    select: { createdAt: true },
    where: {
      createdAt: { gte: eightWeeksAgo },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group patients by week in JavaScript (much faster than 8 separate queries)
  const weeksData: Array<{ weekStart: Date; weekEnd: Date; count: number; label: string }> = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const count = recentPatients.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= weekStart && createdAt < weekEnd;
    }).length;
    
    weeksData.push({
      weekStart,
      weekEnd,
      count,
      label: `Week ${8 - i}`,
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-teal mb-1 sm:mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Real-time insights and performance metrics for DoXcia</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Patients - Teal */}
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal/90 p-4 sm:p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-xs sm:text-sm font-medium bg-white/20 px-2 py-1 rounded">All Time</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-1">{totalPatients}</h3>
          <p className="text-xs sm:text-sm text-white/90">Total Patients Registered</p>
        </div>

        {/* This Month - White with Teal accent */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-brand-teal hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-brand-teal/10 rounded-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-teal" />
            </div>
            <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded ${
              Number(growthRate) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-red'
            }`}>
              {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-teal mb-1">{patientsThisMonth}</h3>
          <p className="text-xs sm:text-sm text-gray-600">New Patients This Month</p>
        </div>

        {/* This Week - Yellow */}
        <div className="bg-gradient-to-br from-brand-yellow to-brand-yellow/90 p-4 sm:p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-xs sm:text-sm font-medium bg-white/20 px-2 py-1 rounded">This Week</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-1">{patientsThisWeek}</h3>
          <p className="text-xs sm:text-sm text-white/90">New Patients This Week</p>
        </div>

        {/* Today's Consultations - White with Yellow accent */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-brand-yellow hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-brand-yellow/10 rounded-lg">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-brand-yellow" />
            </div>
            <span className="text-xs sm:text-sm font-medium bg-brand-yellow/10 text-brand-yellow px-2 py-1 rounded">Today</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-yellow mb-1">{consultationsToday}</h3>
          <p className="text-xs sm:text-sm text-gray-600">Consultations Today</p>
        </div>
      </div>

      {/* Follow-up Tracking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Follow-ups This Week */}
        <div className="bg-gradient-to-br from-brand-teal/10 to-brand-teal/5 p-4 sm:p-6 rounded-xl border-2 border-brand-teal/30 hover:border-brand-teal/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-brand-teal/10 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-brand-teal" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-teal mb-1">{followUpsThisWeek}</h3>
          <p className="text-xs sm:text-sm text-gray-600">Follow-ups This Week</p>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-gradient-to-br from-brand-yellow/10 to-brand-yellow/5 p-4 sm:p-6 rounded-xl border-2 border-brand-yellow/30 hover:border-brand-yellow/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-brand-yellow/10 rounded-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-brand-yellow" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-yellow mb-1">{upcomingFollowUps}</h3>
          <p className="text-xs sm:text-sm text-gray-600">Total Upcoming Follow-ups</p>
        </div>

        {/* Overdue Follow-ups */}
        <div className="bg-gradient-to-br from-brand-red/10 to-brand-red/5 p-4 sm:p-6 rounded-xl border-2 border-brand-red/30 hover:border-brand-red/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-brand-red/10 rounded-lg">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-brand-red" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-red mb-1">{overdueFollowUps}</h3>
          <p className="text-xs sm:text-sm text-gray-600">Overdue Follow-ups</p>
        </div>
      </div>

      {/* NEW: Appointment Types & Weekly Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Appointment Types (Old/New Patient) */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-brand-teal">Appointment Types</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-brand-teal" />
            </div>
          </div>
          
          {totalAppointments > 0 ? (
            <div className="space-y-6">
              {/* Old Patients */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-brand-teal"></div>
                    <span className="text-sm font-medium text-gray-700">Existing Patients</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-teal">{oldPatientAppointments}</p>
                    <p className="text-xs text-gray-500">{((oldPatientAppointments / totalAppointments) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-brand-teal h-3 rounded-full transition-all" 
                    style={{ width: `${(oldPatientAppointments / totalAppointments) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* New Patients */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-brand-yellow"></div>
                    <span className="text-sm font-medium text-gray-700">New/Walk-in Patients</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-yellow">{newPatientAppointments}</p>
                    <p className="text-xs text-gray-500">{((newPatientAppointments / totalAppointments) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-brand-yellow h-3 rounded-full transition-all" 
                    style={{ width: `${(newPatientAppointments / totalAppointments) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total Appointments</span>
                  <span className="text-xl font-bold text-gray-900">{totalAppointments}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No appointment data available yet</p>
            </div>
          )}
        </div>

        {/* Week on Week New Patient Registrations */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-brand-teal">Weekly Patient Registrations</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-brand-teal" />
            </div>
          </div>
          
          <div className="space-y-3">
            {weeksData.map((week, index) => {
              const prevWeek = index > 0 ? weeksData[index - 1] : null;
              const change = prevWeek ? week.count - prevWeek.count : 0;
              const changePercent = prevWeek && prevWeek.count > 0 
                ? ((change / prevWeek.count) * 100).toFixed(0) 
                : '0';
              const isCurrentWeek = index === weeksData.length - 1;
              
              return (
                <div key={index} className={`${isCurrentWeek ? 'bg-brand-teal/5 p-3 rounded-lg border-2 border-brand-teal/20' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${isCurrentWeek ? 'text-brand-teal font-bold' : 'text-gray-600'}`}>
                        {week.label} {isCurrentWeek && '(Current)'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {week.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${isCurrentWeek ? 'text-brand-teal' : 'text-gray-900'}`}>
                        {week.count}
                      </span>
                      {index > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          change > 0 
                            ? 'bg-green-100 text-green-700' 
                            : change < 0 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {change > 0 ? '+' : ''}{change} ({changePercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${isCurrentWeek ? 'bg-brand-teal' : 'bg-gray-400'}`}
                      style={{ width: `${Math.max((week.count / Math.max(...weeksData.map(w => w.count))) * 100, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>8-Week Average:</span>
              <span className="font-bold text-brand-teal">
                {(weeksData.reduce((sum, w) => sum + w.count, 0) / weeksData.length).toFixed(1)} patients/week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Record Completion Rate */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Record Completion Rate</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-teal">{completionRate}%</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{patientsWithCompleteRecords} of {totalPatients} patients</p>
            </div>
            <Activity className="h-8 w-8 text-brand-teal/30" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-brand-teal to-brand-teal/70 h-3 rounded-full transition-all" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Patients with consultation, signs, and treatment recorded</p>
        </div>

        {/* Average Daily Patients */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Average Daily Patients</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-yellow">{avgPatientsPerDay}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">patients per day</p>
            </div>
            <TrendingUp className="h-8 w-8 text-brand-yellow/30" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">Based on {patientsThisMonth} patients in {today.getDate()} days</p>
          </div>
        </div>

        {/* Follow-up Compliance */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-brand-teal mb-4">Follow-up Compliance</h3>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-brand-red">{overdueFollowUps}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">require attention</p>
            </div>
            <Clock className="h-8 w-8 text-brand-red/30" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">{upcomingFollowUps} upcoming appointments scheduled</p>
          </div>
        </div>
      </div>

      {/* Demographics & Medical Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gender Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-brand-teal mb-4 sm:mb-6">Gender Distribution</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Male</span>
                <span className="text-xs sm:text-sm font-bold text-brand-teal">{maleCount} ({totalPatients > 0 ? ((maleCount / totalPatients) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-brand-teal h-2 sm:h-3 rounded-full transition-all" 
                  style={{ width: `${totalPatients > 0 ? (maleCount / totalPatients) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Female</span>
                <span className="text-xs sm:text-sm font-bold text-brand-teal">{femaleCount} ({totalPatients > 0 ? ((femaleCount / totalPatients) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-brand-yellow h-2 sm:h-3 rounded-full transition-all" 
                  style={{ width: `${totalPatients > 0 ? (femaleCount / totalPatients) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            {otherCount > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Other</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-teal">{otherCount} ({totalPatients > 0 ? ((otherCount / totalPatients) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-brand-red h-2 sm:h-3 rounded-full transition-all" 
                    style={{ width: `${totalPatients > 0 ? (otherCount / totalPatients) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-brand-teal mb-4 sm:mb-6">Age Distribution</h3>
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(ageGroups).map(([range, count]) => (
              <div key={range}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{range} years</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-teal">{count} ({totalPatients > 0 ? ((count / totalPatients) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-brand-teal h-2 sm:h-3 rounded-full transition-all" 
                    style={{ width: `${totalPatients > 0 ? (count / totalPatients) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Common Conditions/Diseases */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-brand-teal">Common Conditions</h3>
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              <Activity className="h-5 w-5 text-brand-teal" />
            </div>
          </div>
          {topConditions.length > 0 ? (
            <div className="space-y-3">
              {topConditions.map((condition, index) => (
                <div key={condition.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">{condition.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-teal h-2 rounded-full transition-all" 
                        style={{ width: `${(condition.count / topConditions[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-brand-teal w-8 text-right">{condition.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No condition data available yet</p>
            </div>
          )}
        </div>

        {/* Frequently Prescribed Medicines */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-brand-yellow">Top Prescribed Medicines</h3>
            <div className="p-2 bg-brand-yellow/10 rounded-lg">
              <Stethoscope className="h-5 w-5 text-brand-yellow" />
            </div>
          </div>
          {topMedicines.length > 0 ? (
            <div className="space-y-3">
              {topMedicines.map((medicine, index) => (
                <div key={medicine.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-yellow/10 text-brand-yellow text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{medicine.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-yellow h-2 rounded-full transition-all" 
                        style={{ width: `${(medicine.count / topMedicines[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-brand-yellow w-8 text-right">{medicine.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No medicine data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-gradient-to-br from-brand-teal/5 via-white to-brand-yellow/5 p-4 sm:p-6 rounded-xl border-2 border-brand-teal/20">
        <h3 className="text-lg sm:text-xl font-bold text-brand-teal mb-4 sm:mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Actionable Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Growth Insight */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">Patient Growth Trend</p>
                <p className="text-gray-700">
                  {Number(growthRate) >= 0 ? (
                    <>Your patient base has <span className="font-semibold text-green-600">grown by {growthRate}%</span> this month. {Number(growthRate) > 10 ? 'Excellent growth! Consider expanding clinic hours.' : 'Steady growth maintained.'}</>
                  ) : (
                    <>Patient registrations have <span className="font-semibold text-brand-red">decreased by {Math.abs(Number(growthRate))}%</span>. Consider reviewing marketing strategies.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Alert */}
          <div className={`bg-white p-4 rounded-lg border-l-4 shadow-sm ${overdueFollowUps > 0 ? 'border-brand-red' : 'border-brand-yellow'}`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${overdueFollowUps > 0 ? 'bg-brand-red/10' : 'bg-brand-yellow/10'}`}>
                <AlertCircle className={`h-5 w-5 ${overdueFollowUps > 0 ? 'text-brand-red' : 'text-brand-yellow'}`} />
              </div>
              <div>
                <p className={`font-bold mb-1 ${overdueFollowUps > 0 ? 'text-brand-red' : 'text-brand-yellow'}`}>
                  {overdueFollowUps > 0 ? 'Urgent: Follow-up Required' : 'Follow-up Status'}
                </p>
                <p className="text-gray-700">
                  {overdueFollowUps > 0 ? (
                    <><span className="font-semibold">{overdueFollowUps} patient{overdueFollowUps !== 1 ? 's have' : ' has'}</span> missed follow-up appointments. Contact them to reschedule.</>
                  ) : (
                    <>All follow-ups are on track! {upcomingFollowUps} appointment{upcomingFollowUps !== 1 ? 's' : ''} scheduled.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Record Completion */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-yellow shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-brand-yellow/10 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-brand-yellow" />
              </div>
              <div>
                <p className="font-bold text-brand-yellow mb-1">Record Completion</p>
                <p className="text-gray-700">
                  {Number(completionRate) >= 80 ? (
                    <>Excellent! <span className="font-semibold">{completionRate}%</span> of patient records are complete. Keep up the good work!</>
                  ) : Number(completionRate) >= 60 ? (
                    <>Good progress at <span className="font-semibold">{completionRate}%</span>. {totalPatients - patientsWithCompleteRecords} records need completion.</>
                  ) : (
                    <>Only <span className="font-semibold">{completionRate}%</span> records complete. Focus on documenting consultations and treatments.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <Calendar className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">This Week's Activity</p>
                <p className="text-gray-700">
                  <span className="font-semibold">{patientsThisWeek} new patient{patientsThisWeek !== 1 ? 's' : ''}</span> registered and <span className="font-semibold">{followUpsThisWeek} follow-up{followUpsThisWeek !== 1 ? 's' : ''}</span> scheduled this week.
                  {consultationsToday > 0 && <> {consultationsToday} consultation{consultationsToday !== 1 ? 's' : ''} today.</>}
                </p>
              </div>
            </div>
          </div>

          {/* Workload Insight */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-teal shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg flex-shrink-0">
                <Activity className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-bold text-brand-teal mb-1">Daily Workload</p>
                <p className="text-gray-700">
                  Averaging <span className="font-semibold">{avgPatientsPerDay} patients per day</span> this month.
                  {Number(avgPatientsPerDay) > 10 ? ' High volume - ensure adequate staffing.' : ' Manageable patient flow.'}
                </p>
              </div>
            </div>
          </div>

          {/* Demographics Insight */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-brand-yellow shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-brand-yellow/10 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 text-brand-yellow" />
              </div>
              <div>
                <p className="font-bold text-brand-yellow mb-1">Patient Demographics</p>
                <p className="text-gray-700">
                  Primary patient group: <span className="font-semibold">{maleCount > femaleCount ? 'Male' : 'Female'}</span> ({Math.max(maleCount, femaleCount)} patients).
                  {totalPatients > 0 && <> Gender ratio: {((maleCount / totalPatients) * 100).toFixed(0)}% Male, {((femaleCount / totalPatients) * 100).toFixed(0)}% Female.</>}
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
