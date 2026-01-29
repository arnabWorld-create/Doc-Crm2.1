'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VisitForm from '@/components/VisitForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditVisitPageProps {
  params: { id: string; visitId: string };
}

export default function EditVisitPage({ params }: EditVisitPageProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch patient data
      const patientRes = await fetch(`/api/patients/${params.id}`);
      const patientData = await patientRes.json();
      setPatient(patientData);

      // Fetch visit data
      const visitRes = await fetch(`/api/patients/${params.id}/visits/${params.visitId}`);
      const visitData = await visitRes.json();
      setVisit(visitData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/patients/${params.id}/visits/${params.visitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/patients/${params.id}`);
      } else {
        throw new Error('Failed to update visit');
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-brand-teal">Loading...</div>
      </div>
    );
  }

  if (!patient || !visit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Visit not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-teal mb-2">
            Edit Visit
          </h1>
          <p className="text-gray-600">
            Patient: {patient.name} ({patient.patientId})
          </p>
        </div>
        <Link href={`/patients/${params.id}`}>
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </Link>
      </div>

      <VisitForm
        patientId={params.id}
        initialData={visit}
        onSubmit={handleSubmit}
        isEdit={true}
      />
    </div>
  );
}
