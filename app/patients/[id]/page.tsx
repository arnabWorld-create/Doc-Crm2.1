'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/utils/formatDate';
import { FileText, ArrowLeft, Pill, Plus, Calendar, Activity } from 'lucide-react';
import PrescriptionPrint from '@/components/PrescriptionPrint';
import ConfirmModal from '@/components/ConfirmModal';

interface PatientDetailPageProps {
  params: { id: string };
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPatient();
  }, [params.id]);

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}`);
      if (!response.ok) {
        router.push('/patients');
        return;
      }
      const data = await response.json();
      setPatient(data);
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      router.push('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = (visitId: string) => {
    setVisitToDelete(visitId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/patients/${params.id}/visits/${visitToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setVisitToDelete(null);
        fetchPatient(); // Refresh patient data
      } else {
        alert('Failed to delete visit');
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete visit');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-teal border-b-transparent"></div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-teal rounded-xl flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-full">
                  {patient.patientId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{patient.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                {patient.age && <span>{patient.age} yrs</span>}
                {patient.gender && <><span>·</span><span>{patient.gender}</span></>}
                {patient.contact && <><span>·</span><span>{patient.contact}</span></>}
              </div>
              {(patient.bloodGroup || patient.allergies || patient.chronicConditions) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs">
                  {patient.bloodGroup && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded font-semibold">
                      🩸 {patient.bloodGroup}
                    </span>
                  )}
                  {patient.allergies && (
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">
                      ⚠️ {patient.allergies}
                    </span>
                  )}
                  {patient.chronicConditions && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                      🔄 {patient.chronicConditions}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/patients" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </Link>
            <Link href={`/patients/${patient.id}/visit/new`} className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-sm transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Visit
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-teal" />
            Visit History
            <span className="text-sm font-normal text-gray-400">({patient.visits.length})</span>
          </h3>
        </div>

        {patient.visits.length > 0 ? (
          <div className="space-y-4">
            {patient.visits.map((visit: any, index: number) => {
              const reports = visit.reports ? JSON.parse(visit.reports as string) : [];
              return (
                <div key={visit.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-brand-teal/40 transition-all">
                  {/* Visit Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white bg-brand-teal px-2.5 py-0.5 rounded-full">
                          Visit #{patient.visits.length - index}
                        </span>
                        <span className="text-xs font-medium text-gray-500">{visit.visitType}</span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(visit.visitDate)}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center gap-2">
                      <Link href={`/patients/${patient.id}/visit/${visit.id}/edit`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 rounded-lg hover:bg-brand-yellow hover:text-white text-xs font-semibold transition-all">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-brand-red border border-red-200 rounded-lg hover:bg-brand-red hover:text-white text-xs font-semibold transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                      <PrescriptionPrint
                        patient={{
                          patientId: patient.patientId,
                          name: patient.name,
                          age: patient.age,
                          gender: patient.gender,
                          contact: patient.contact,
                          address: patient.address,
                        }}
                        visit={visit}
                      />
                    </div>
                  </div>

                  {/* Visit Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visit.chiefComplaint && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5">Chief Complaint</h4>
                        <p className="text-sm text-gray-700">{visit.chiefComplaint}</p>
                      </div>
                    )}
                    {visit.signs && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1.5">Signs & Symptoms</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.signs}</p>
                      </div>
                    )}
                    {visit.investigations && (
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">Investigations</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.investigations}</p>
                      </div>
                    )}
                    {visit.diagnosis && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1.5">Diagnosis</h4>
                        <p className="text-sm text-gray-700">{visit.diagnosis}</p>
                      </div>
                    )}
                    {visit.treatment && (
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1.5">Treatment</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.treatment}</p>
                      </div>
                    )}
                    {((visit.medications && visit.medications.length > 0) || visit.medicines) && (
                      <div className="bg-orange-50 p-3 rounded-lg md:col-span-2">
                        <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5" />Medicines
                        </h4>
                        {visit.medications && visit.medications.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                            {visit.medications.map((med: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span className="text-sm text-gray-700">
                                  {med.medicine}{med.dose && ` — ${med.dose}`}{med.frequency && ` (${med.frequency})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : visit.medicines ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.medicines}</p>
                        ) : null}
                      </div>
                    )}
                    {(visit.temp || visit.spo2 || visit.pulse || visit.bloodPressure || visit.bpSystolic || visit.bpDiastolic || visit.rbs) && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5">Vitals</h4>
                        <div className="grid grid-cols-2 gap-1.5 text-sm">
                          {visit.temp && <div><span className="text-gray-500">Temp:</span> <span className="font-semibold">{visit.temp}°F</span></div>}
                          {visit.spo2 && <div><span className="text-gray-500">SpO2:</span> <span className="font-semibold">{visit.spo2}%</span></div>}
                          {visit.pulse && <div><span className="text-gray-500">Pulse:</span> <span className="font-semibold">{visit.pulse} bpm</span></div>}
                          {visit.bloodPressure && <div><span className="text-gray-500">BP:</span> <span className="font-semibold">{visit.bloodPressure}</span></div>}
                          {visit.bpSystolic && visit.bpDiastolic && <div><span className="text-gray-500">BP:</span> <span className="font-semibold">{visit.bpSystolic}/{visit.bpDiastolic}</span></div>}
                          {visit.rbs && <div><span className="text-gray-500">RBS:</span> <span className="font-semibold">{visit.rbs} mg/dl</span></div>}
                        </div>
                      </div>
                    )}
                    {visit.followUpDate && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-1.5">Follow-up</h4>
                        <p className="text-sm text-gray-700 font-medium">{formatDate(visit.followUpDate)}</p>
                        {visit.followUpNotes && <p className="text-xs text-gray-500 mt-1">{visit.followUpNotes}</p>}
                      </div>
                    )}
                  </div>

                  {reports.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reports</h4>
                      <div className="flex flex-wrap gap-2">
                        {reports.map((report: any, idx: number) => (
                          <a key={idx} href={report.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-teal bg-brand-teal/10 hover:bg-brand-teal hover:text-white rounded-lg transition-all">
                            <FileText className="h-3 w-3" />{report.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-14">
            <Activity className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No visits recorded yet</p>
            <Link href={`/patients/${patient.id}/visit/new`}>
              <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />Add First Visit
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Visit Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setVisitToDelete(null);
        }}
        onConfirm={confirmDeleteVisit}
        title="Delete Visit"
        message="Are you sure you want to delete this visit? This action cannot be undone and all visit data including prescriptions will be permanently removed."
        confirmText="Delete Visit"
        isLoading={isDeleting}
      />
    </div>
  );
}
