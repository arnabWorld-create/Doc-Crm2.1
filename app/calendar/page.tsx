import prisma from '@/lib/prisma';
import CalendarView from '@/components/CalendarView';
import { PageHero } from '@/components/ui/page-hero';
import { Calendar } from 'lucide-react';

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
    <div className="space-y-5">
      <PageHero
        eyebrow="Calendar"
        eyebrowIcon={<Calendar className="h-3.5 w-3.5" />}
        title="Appointment Calendar"
        subtitle={`${new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}
        stats={[
          { label: 'Consultations', value: consultations.length },
          { label: 'Follow-ups', value: followUps.length },
        ]}
      />
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
