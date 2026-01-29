import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VisitForm from '@/components/VisitForm';

interface AddVisitPageProps {
  params: { id: string };
}

const AddVisitPage = async ({ params }: AddVisitPageProps) => {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-brand-teal">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-sm font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                {patient.patientId}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-teal">{patient.name}</h1>
            </div>
            <p className="text-sm text-gray-600">
              {patient.age && `${patient.age} years`} {patient.gender && `• ${patient.gender}`} {patient.contact && `• ${patient.contact}`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-gray-100">
        <h2 className="text-xl font-bold text-brand-teal mb-4">Add New Visit</h2>
        <VisitForm patientId={patient.id} />
      </div>
    </div>
  );
};

export default AddVisitPage;
