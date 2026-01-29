import prisma from '@/lib/prisma';
import CalendarView from '@/components/CalendarView';

// Cache calendar for 1 minute (60 seconds) - balance between freshness and performance
// This reduces database queries by 50% while keeping data relatively fresh
export const revalidate = 60;

interface CalendarPageProps {
  searchParams?: {
    month?: string;
    year?: string;
  };
}

const CalendarPage = async ({ searchParams }: CalendarPageProps) => {
  const today = new Date();
  const currentMonth = searchParams?.month ? parseInt(searchParams.month) : today.getMonth();
  const currentYear = searchParams?.year ? parseInt(searchParams.year) : today.getFullYear();

  // Get first and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Batch both queries for better performance
  const [visits, followUpVisits] = await Promise.all([
    // Fetch visits with dates in this month
    prisma.visit.findMany({
      where: {
        visitDate: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      select: {
        visitDate: true,
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            age: true,
            gender: true,
            contact: true,
          },
        },
      },
      orderBy: {
        visitDate: 'asc',
      },
    }),
    // Fetch visits with follow-up dates in this month
    prisma.visit.findMany({
      where: {
        followUpDate: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      select: {
        followUpDate: true,
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            age: true,
            gender: true,
            contact: true,
          },
        },
      },
      orderBy: {
        followUpDate: 'asc',
      },
    }),
  ]);

  // Transform visits to consultations format
  const consultations = visits.map(visit => ({
    id: visit.patient.id,
    name: visit.patient.name,
    age: visit.patient.age,
    gender: visit.patient.gender,
    contact: visit.patient.contact,
    consultationDate: visit.visitDate,
  }));

  // Transform follow-up visits
  const followUps = followUpVisits.map(visit => ({
    id: visit.patient.id,
    name: visit.patient.name,
    age: visit.patient.age,
    gender: visit.patient.gender,
    contact: visit.patient.contact,
    followUpDate: visit.followUpDate,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-teal mb-1 sm:mb-2">
          Appointment Calendar
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View consultations and follow-up appointments by date
        </p>
      </div>

      <CalendarView
        consultations={consultations}
        followUps={followUps}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
};

export default CalendarPage;
