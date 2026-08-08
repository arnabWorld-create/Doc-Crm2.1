import PatientTable from '@/components/PatientTable';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { PageHero } from '@/components/ui/page-hero';
import { Users } from 'lucide-react';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

interface PatientsPageProps {
  searchParams?: {
    search?: string;
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
    month?: string;
  };
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
  const search = searchParams?.search || '';
  const currentPage = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.limit) || 10;
  const startDate = searchParams?.startDate;
  const endDate = searchParams?.endDate;
  const month = searchParams?.month;

  // Build where clause with search and date filters
  const whereClause: any = {};

  // Search filter
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { contact: { contains: search, mode: 'insensitive' as const } },
      { patientId: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  // Date range filter on visits
  const visitFilter: any = {};
  if (month) {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);
    
    visitFilter.visitDate = {
      gte: monthStart,
      lt: monthEnd,
    };
  } else if (startDate || endDate) {
    visitFilter.visitDate = {};
    if (startDate) {
      visitFilter.visitDate.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      visitFilter.visitDate.lt = endDateTime;
    }
  }

  // If date filter is applied, filter by visits
  if (Object.keys(visitFilter).length > 0) {
    whereClause.visits = {
      some: visitFilter,
    };
  }

  const [patients, totalPatients] = await Promise.all([
    prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        patientId: true,
        name: true,
        age: true,
        gender: true,
        contact: true,
        // Only pull the most-recent visit date for "Last Visit" column
        visits: {
          select: { visitDate: true },
          orderBy: { visitDate: 'desc' },
          take: 1,
        },
        // Use _count so the "Visits" column always shows the real total
        _count: {
          select: { visits: true },
        },
      },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.patient.count({ where: whereClause }),
  ]);

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Patient Management"
        eyebrowIcon={<Users className="h-3.5 w-3.5" />}
        title="Patient Records"
        subtitle="Manage and track all patient information"
        stats={[
          { label: 'Total', value: totalPatients.toLocaleString('en-IN') },
        ]}
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-teal border-b-transparent"></div>
        </div>
      }>
        <PatientTable
          patients={patients}
          totalPatients={totalPatients}
          currentPage={currentPage}
          perPage={perPage}
        />
      </Suspense>
    </div>
  );
};

export default PatientsPage;