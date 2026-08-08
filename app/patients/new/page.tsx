'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PatientForm from '@/components/PatientForm';
import QuickPatientSearch from '@/components/QuickPatientSearch';
import { AlertCircle, UserPlus } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

function NewPatientContent() {
  const searchParams = useSearchParams();
  const preFillName = searchParams.get('name') || '';
  const preFillContact = searchParams.get('contact') || '';
  const appointmentId = searchParams.get('appointmentId') || '';

  const defaultValues = (preFillName || preFillContact) ? {
    name: preFillName,
    contact: preFillContact,
  } : undefined;
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Patients"
        eyebrowIcon={<UserPlus className="h-3.5 w-3.5" />}
        title="Add New Patient"
        subtitle="Fill in the patient information and first visit details below"
      />

      {/* Quick Search - Check if patient already exists */}
      <div className="bg-brand-yellow/10 border-l-4 border-brand-yellow p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-brand-yellow mb-2">
              Check if patient already exists
            </h3>
            <p className="text-xs text-gray-700 mb-3">
              Search by name, phone number, or patient ID before adding a new patient to avoid duplicates.
            </p>
            <QuickPatientSearch />
          </div>
        </div>
      </div>

      {/* Show info if coming from appointment */}
      {appointmentId && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-blue-700 mb-1">
                Creating patient from walk-in appointment
              </h3>
              <p className="text-xs text-blue-600">
                After saving, this patient will be linked to the appointment.
              </p>
            </div>
          </div>
        </div>
      )}

      <PatientForm defaultValues={defaultValues ? (defaultValues as any) : null} appointmentId={appointmentId} />
    </div>
  );
}

const NewPatientPage = () => {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-brand-teal rounded-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-teal leading-tight">Add New Patient</h1>
            <p className="text-sm text-gray-500 mt-0.5">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <NewPatientContent />
    </Suspense>
  );
};

export default NewPatientPage;