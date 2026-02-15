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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal"></div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border-4 border-brand-teal">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 md:p-4 bg-brand-red rounded-lg sm:rounded-xl">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs sm:text-sm font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                  {patient.patientId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-teal mb-1">{patient.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-600 text-xs sm:text-sm">
                {patient.age && <span className="font-medium">{patient.age} years</span>}
                {patient.gender && <><span className="hidden sm:inline">•</span><span className="font-medium">{patient.gender}</span></>}
                {patient.contact && <><span className="hidden sm:inline">•</span><span className="font-medium">{patient.contact}</span></>}
              </div>
              {/* Medical History */}
              {(patient.bloodGroup || patient.allergies || patient.chronicConditions) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                    {patient.bloodGroup && (
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-red-600">Blood:</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">{patient.bloodGroup}</span>
                      </div>
                    )}
                    {patient.allergies && (
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold text-orange-600">Allergies:</span>
                        <span className="text-gray-700">{patient.allergies}</span>
                      </div>
                    )}
                    {patient.chronicConditions && (
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold text-purple-600">Chronic:</span>
                        <span className="text-gray-700">{patient.chronicConditions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/patients" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center px-4 sm:px-5 py-2 sm:py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </Link>
            <Link href={`/patients/${patient.id}/visit/new`} className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center px-4 sm:px-5 py-2 sm:py-3 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Visit
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-brand-teal flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Visit History ({patient.visits.length})
          </h3>
        </div>

        {patient.visits.length > 0 ? (
          <div className="space-y-4">
            {patient.visits.map((visit: any, index: number) => {
              const reports = visit.reports ? JSON.parse(visit.reports as string) : [];
              
              return (
                <div key={visit.id} className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-brand-teal transition-all">
                  {/* Visit Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-white bg-brand-teal px-3 py-1 rounded-full">
                          Visit #{patient.visits.length - index}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          {visit.visitType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(visit.visitDate)}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-3 sm:mt-0 flex items-center gap-2">
                      <Link href={`/patients/${patient.id}/visit/${visit.id}/edit`}>
                        <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-brand-yellow text-white rounded-lg hover:bg-brand-yellow/90 transition-colors">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visit.chiefComplaint && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Chief Complaint</h4>
                        <p className="text-sm text-gray-700">{visit.chiefComplaint}</p>
                      </div>
                    )}

                    {visit.signs && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-purple-700 uppercase mb-2">Signs & Symptoms</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.signs}</p>
                      </div>
                    )}

                    {visit.investigations && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">Investigations</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.investigations}</p>
                      </div>
                    )}

                    {visit.diagnosis && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Diagnosis</h4>
                        <p className="text-sm text-gray-700">{visit.diagnosis}</p>
                      </div>
                    )}

                    {visit.treatment && (
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-teal-700 uppercase mb-2">Treatment</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.treatment}</p>
                      </div>
                    )}

                    {/* Medicines - show structured or text */}
                    {((visit.medications && visit.medications.length > 0) || visit.medicines) && (
                      <div className="bg-orange-50 p-4 rounded-lg md:col-span-2">
                        <h4 className="text-xs font-bold text-orange-700 uppercase mb-2 flex items-center">
                          <Pill className="h-4 w-4 mr-1" />
                          Medicines
                        </h4>
                        {visit.medications && visit.medications.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {visit.medications.map((med: any, idx: number) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span className="text-sm text-gray-700">
                                  {med.medicine}
                                  {med.dose && ` - ${med.dose}`}
                                  {med.frequency && ` (${med.frequency})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : visit.medicines ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.medicines}</p>
                        ) : null}
                      </div>
                    )}

                    {/* Vitals */}
                    {(visit.temp || visit.spo2 || visit.pulse || visit.bloodPressure || visit.bpSystolic || visit.bpDiastolic || visit.rbs) && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Vitals</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {visit.temp && <div><span className="text-gray-600">Temp:</span> <span className="font-semibold">{visit.temp}°F</span></div>}
                          {visit.spo2 && <div><span className="text-gray-600">SpO2:</span> <span className="font-semibold">{visit.spo2}%</span></div>}
                          {visit.pulse && <div><span className="text-gray-600">Pulse:</span> <span className="font-semibold">{visit.pulse} bpm</span></div>}
                          {visit.bloodPressure && <div><span className="text-gray-600">BP:</span> <span className="font-semibold">{visit.bloodPressure} mmHg</span></div>}
                          {visit.bpSystolic && visit.bpDiastolic && <div><span className="text-gray-600">BP:</span> <span className="font-semibold">{visit.bpSystolic}/{visit.bpDiastolic} mmHg</span></div>}
                          {visit.rbs && <div><span className="text-gray-600">RBS:</span> <span className="font-semibold">{visit.rbs} mg/dl</span></div>}
                        </div>
                      </div>
                    )}

                    {visit.followUpDate && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">Follow-up</h4>
                        <p className="text-sm text-gray-700">{formatDate(visit.followUpDate)}</p>
                        {visit.followUpNotes && <p className="text-xs text-gray-600 mt-1">{visit.followUpNotes}</p>}
                      </div>
                    )}
                  </div>

                  {/* Reports */}
                  {reports.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Reports</h4>
                      <div className="flex flex-wrap gap-2">
                        {reports.map((report: any, idx: number) => (
                          <a
                            key={idx}
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-1.5 text-xs font-medium text-brand-teal bg-brand-teal/10 hover:bg-brand-teal hover:text-white rounded-lg transition-all"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {report.filename}
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
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No visits recorded yet</p>
            <Link href={`/patients/${patient.id}/visit/new`}>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add First Visit
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
