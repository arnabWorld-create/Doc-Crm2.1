'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, Trash2, UserPlus, Download, Users, Plus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';
import SearchInput from './SearchInput';
import DateRangeFilter from './DateRangeFilter';

interface Visit {
  id?: string;
  visitDate: Date;
  visitType?: string;
}

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  visits: Visit[];
  _count?: {
    visits: number;
  };
}

interface PatientTableProps {
  patients: Patient[];
  totalPatients: number;
  currentPage: number;
  perPage: number;
}

const PatientTable: React.FC<PatientTableProps> = ({ patients, totalPatients, currentPage, perPage }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(totalPatients / perPage);

  const buildExportUrl = () => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const month = searchParams.get('month');
    
    if (search) params.set('search', search);
    if (month) params.set('month', month);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    return `/api/patients/export${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleDeleteClick = (id: string) => {
    setSelectedPatientId(id);
    setIsModalOpen(true);
  };

  const getDeleteMessage = () => {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return 'Are you sure you want to delete this patient?';
    
    const visitCount = patient._count?.visits || patient.visits.length;
    if (visitCount === 0) {
      return `Are you sure you want to delete ${patient.name}? This action cannot be undone.`;
    }
    
    return `Are you sure you want to delete ${patient.name}? This will permanently delete:\n\n• Patient record\n• ${visitCount} visit${visitCount > 1 ? 's' : ''}\n• All prescriptions and medical history\n\nThis action cannot be undone.`;
  };

  const handleConfirmDelete = async () => {
    if (!selectedPatientId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/patients/${selectedPatientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete patient');
      }
      setIsModalOpen(false);
      setSelectedPatientId(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white p-3 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-full">
          <SearchInput placeholder="Search by name, phone, or patient ID..." />
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <a 
              href={buildExportUrl()} 
              download 
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-teal bg-white border-2 border-brand-teal rounded-lg hover:bg-brand-teal hover:text-white transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="sm:inline">Export Excel</span>
            </a>
            <Link href="/patients/new" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-md hover:shadow-lg transition-all">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </button>
            </Link>
          </div>
          <div className="flex-1">
            <DateRangeFilter />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {patients.length > 0 ? patients.map((patient) => {
          const lastVisit = patient.visits[0];
          return (
            <div key={patient.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded">
                      {patient.patientId}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{patient.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {patient.age && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow border border-brand-yellow font-bold">
                        {patient.age} yrs
                      </span>
                    )}
                    {patient.gender && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {patient.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex items-center text-gray-600">
                  <span className="font-medium w-24">Contact:</span>
                  <span>{patient.contact || 'N/A'}</span>
                </div>
                {lastVisit && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium w-24">Last Visit:</span>
                    <span>{new Date(lastVisit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <span className="font-medium w-24">Total Visits:</span>
                  <span className="font-bold text-brand-teal">{patient._count?.visits || patient.visits.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <Link href={`/patients/${patient.id}`} title="View">
                  <div className="p-2 rounded-lg bg-brand-teal/10 hover:bg-brand-teal transition-colors group">
                    <Eye className="h-4 w-4 text-brand-teal group-hover:text-white transition-colors" />
                  </div>
                </Link>
                <Link href={`/patients/${patient.id}/visit/new`} title="Add Visit">
                  <div className="p-2 rounded-lg bg-brand-yellow/10 hover:bg-brand-yellow transition-colors group">
                    <Plus className="h-4 w-4 text-brand-yellow group-hover:text-white transition-colors" />
                  </div>
                </Link>
                <button onClick={() => handleDeleteClick(patient.id)} title="Delete">
                  <div className="p-2 rounded-lg bg-brand-red/10 hover:bg-brand-red transition-colors group">
                    <Trash2 className="h-4 w-4 text-brand-red group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Users className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500 font-medium">No patients found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or add a new patient</p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border-2 border-gray-100">
        <table className="min-w-full divide-y-2 divide-gray-100">
          <thead className="bg-brand-teal">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Patient ID</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Age</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Gender</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Last Visit</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Total Visits</th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {patients.length > 0 ? patients.map((patient) => {
              const lastVisit = patient.visits[0];
              return (
                <tr key={patient.id} className="hover:bg-brand-teal/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                      {patient.patientId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-brand-teal">{patient.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-yellow/20 text-brand-yellow border border-brand-yellow">
                      {patient.age || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {patient.gender || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{patient.contact || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lastVisit ? new Date(lastVisit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No visits'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-brand-teal">{patient._count?.visits || patient.visits.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/patients/${patient.id}`} title="View Details">
                        <div className="p-2 rounded-lg bg-brand-teal/10 hover:bg-brand-teal transition-colors group">
                          <Eye className="h-5 w-5 text-brand-teal group-hover:text-white transition-colors" />
                        </div>
                      </Link>
                      <Link href={`/patients/${patient.id}/visit/new`} title="Add Visit">
                        <div className="p-2 rounded-lg bg-brand-yellow/10 hover:bg-brand-yellow transition-colors group">
                          <Plus className="h-5 w-5 text-brand-yellow group-hover:text-white transition-colors" />
                        </div>
                      </Link>
                      <button onClick={() => handleDeleteClick(patient.id)} title="Delete Patient">
                        <div className="p-2 rounded-lg bg-brand-red/10 hover:bg-brand-red transition-colors group">
                          <Trash2 className="h-5 w-5 text-brand-red group-hover:text-white transition-colors" />
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Users className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">No patients found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or add a new patient</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPatients > perPage && (
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Patient"
        message={getDeleteMessage()}
        isSubmitting={isDeleting}
      />
    </div>
  );
};

export default PatientTable;
