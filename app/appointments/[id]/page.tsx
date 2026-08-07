'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Edit, Trash2, CheckCircle, Plus } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import ConfirmModal from '@/components/ConfirmModal';

interface AppointmentDetailPageProps {
  params: { id: string };
}

export default function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      } else {
        router.push('/appointments');
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      router.push('/appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointment();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/appointments');
      } else {
        alert('Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Confirmed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Completed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'No-Show':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-teal border-b-transparent"></div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-teal leading-tight">
            Appointment Details
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage appointment</p>
        </div>
        <Link href="/appointments">
          <button className="flex items-center px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </Link>
      </div>

      {/* Status + Delete */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-brand-red border border-red-200 rounded-lg hover:bg-brand-red hover:text-white text-sm font-medium transition-all"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Patient Info */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-brand-teal rounded-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Patient Information</h3>
        </div>

        {appointment.patient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Patient Name</p>
              <Link href={`/patients/${appointment.patient.id}`}>
                <p className="font-semibold text-brand-teal hover:underline cursor-pointer">
                  {appointment.patient.name}
                </p>
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Patient ID</p>
              <p className="font-semibold text-gray-900">{appointment.patient.patientId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age / Gender</p>
              <p className="font-semibold text-gray-900">
                {appointment.patient.age} yrs · {appointment.patient.gender}
              </p>
            </div>
            {appointment.patient.contact && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                <p className="font-semibold text-gray-900">{appointment.patient.contact}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Walk-in — patient record not yet created
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Patient Name</p>
                <p className="font-semibold text-gray-900">{appointment.tempPatientName}</p>
              </div>
              {appointment.tempPatientContact && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                  <p className="font-semibold text-gray-900">{appointment.tempPatientContact}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href={`/patients/new?name=${encodeURIComponent(appointment.tempPatientName)}&contact=${encodeURIComponent(appointment.tempPatientContact || '')}&appointmentId=${appointment.id}`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 rounded-lg hover:bg-brand-yellow hover:text-white text-sm font-semibold transition-all">
                  <Plus className="h-4 w-4" />
                  Create Patient Record
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Info */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-brand-yellow rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Appointment Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
            <p className="font-semibold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time</p>
            <p className="font-semibold text-gray-900">{appointment.appointmentTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
            <p className="font-semibold text-gray-900">{appointment.duration} minutes</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
            <p className="font-semibold text-gray-900">{appointment.appointmentType}</p>
          </div>
          {appointment.reason && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason for Visit</p>
              <p className="font-semibold text-gray-900">{appointment.reason}</p>
            </div>
          )}
          {appointment.notes && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Internal Notes</p>
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Visit for Completed Appointments */}
      {appointment.status === 'Completed' && appointment.patient && (
        <div className="bg-brand-teal/5 p-5 rounded-xl border border-brand-teal/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-brand-teal mb-0.5">Appointment Completed</h3>
              <p className="text-sm text-gray-500">Add consultation details for this appointment</p>
            </div>
            <Link href={`/patients/${appointment.patient.id}/visit/new?appointmentId=${appointment.id}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-all shadow-sm text-sm font-semibold">
                <Plus className="h-4 w-4" />
                Add Visit Record
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Status Actions */}
      {appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {appointment.status === 'Scheduled' && (
              <button
                onClick={() => updateStatus('Confirmed')}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-all disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm
              </button>
            )}
            {(appointment.status === 'Scheduled' || appointment.status === 'Confirmed') && (
              <>
                <button
                  onClick={() => updateStatus('Completed')}
                  disabled={updating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 text-sm font-medium transition-all disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Completed
                </button>
                <button
                  onClick={() => updateStatus('No-Show')}
                  disabled={updating}
                  className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-500 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  No-Show
                </button>
                <button
                  onClick={() => updateStatus('Cancelled')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-50 text-brand-red border border-red-200 rounded-lg hover:bg-brand-red hover:text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Appointment"
        message={`Are you sure you want to delete this appointment for ${appointment.patient ? appointment.patient.name : appointment.tempPatientName}? This action cannot be undone.`}
        confirmText="Delete Appointment"
        isLoading={isDeleting}
      />
    </div>
  );
}
