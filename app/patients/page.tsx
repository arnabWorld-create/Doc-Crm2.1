import PatientTable from '@/components/PatientTable';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Cache patients page for 2 minutes
export const revalidate = 120;

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

  const patients = await prisma.patient.findMany({
    where: whereClause,
    include: {
      visits: {
        select: {
          visitDate: true,
        },
        orderBy: {
          visitDate: 'desc',
        },
        take: 1,
      },
    },
    skip: (currentPage - 1) * perPage,
    take: perPage,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const totalPatients = await prisma.patient.count({ where: whereClause });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-teal mb-1 sm:mb-2">
            Patient Records
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all patient information</p>
        </div>
        <div className="flex items-center text-sm">
          <div className="bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-md border-2 border-brand-yellow">
            <span className="text-gray-600 font-medium">Total Patients:</span>
            <span className="ml-2 font-bold text-brand-yellow text-base sm:text-lg">{totalPatients}</span>
          </div>
        </div>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal"></div>
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