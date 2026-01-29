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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal"></div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-teal mb-2">
            Appointment Details
          </h1>
          <p className="text-gray-600">View and manage appointment</p>
        </div>
        <Link href="/appointments">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </Link>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b-2 border-brand-teal">
          <div className="p-3 bg-brand-teal rounded-xl">
            <User className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-brand-teal">Patient Information</h3>
        </div>

        {appointment.patient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Patient Name</p>
              <Link href={`/patients/${appointment.patient.id}`}>
                <p className="font-semibold text-brand-teal hover:underline cursor-pointer">
                  {appointment.patient.name}
                </p>
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patient ID</p>
              <p className="font-semibold">{appointment.patient.patientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age / Gender</p>
              <p className="font-semibold">
                {appointment.patient.age} years / {appointment.patient.gender}
              </p>
            </div>
            {appointment.patient.contact && (
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold">{appointment.patient.contact}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Walk-in Appointment - Patient record not yet created
              </p>
              <p className="text-xs text-yellow-700">
                Create a full patient record when marking this appointment as completed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Patient Name</p>
                <p className="font-semibold">{appointment.tempPatientName}</p>
              </div>
              {appointment.tempPatientContact && (
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-semibold">{appointment.tempPatientContact}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href={`/patients/new?name=${encodeURIComponent(appointment.tempPatientName)}&contact=${encodeURIComponent(appointment.tempPatientContact || '')}&appointmentId=${appointment.id}`}>
                <button className="flex items-center space-x-2 px-4 py-2 bg-brand-yellow text-white rounded-lg hover:bg-brand-yellow/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create Patient Record Now</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Info */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b-2 border-brand-yellow">
          <div className="p-3 bg-brand-yellow rounded-xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-brand-yellow">Appointment Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-semibold text-lg">{formatDate(appointment.appointmentDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time</p>
            <p className="font-semibold text-lg">{appointment.appointmentTime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold">{appointment.duration} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-semibold">{appointment.appointmentType}</p>
          </div>
          {appointment.reason && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Reason for Visit</p>
              <p className="font-semibold">{appointment.reason}</p>
            </div>
          )}
          {appointment.notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Internal Notes</p>
              <p className="font-semibold text-gray-700">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Visit for Completed Appointments */}
      {appointment.status === 'Completed' && appointment.patient && (
        <div className="bg-gradient-to-br from-brand-teal/10 to-brand-teal/5 p-6 rounded-xl border-2 border-brand-teal/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-brand-teal mb-2">Appointment Completed</h3>
              <p className="text-sm text-gray-600">Add consultation details for this appointment</p>
            </div>
            <Link href={`/patients/${appointment.patient.id}/visit/new?appointmentId=${appointment.id}`}>
              <button className="flex items-center space-x-2 px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg hover:shadow-xl">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Add Visit Record</span>
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Status Actions */}
      {appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Update Status</h3>
          <div className="flex flex-wrap gap-3">
            {appointment.status === 'Scheduled' && (
              <button
                onClick={() => updateStatus('Confirmed')}
                disabled={updating}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Confirm Appointment</span>
              </button>
            )}
            {(appointment.status === 'Scheduled' || appointment.status === 'Confirmed') && (
              <>
                <button
                  onClick={() => updateStatus('Completed')}
                  disabled={updating}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark as Completed</span>
                </button>
                <button
                  onClick={() => updateStatus('No-Show')}
                  disabled={updating}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <span>Mark as No-Show</span>
                </button>
                <button
                  onClick={() => updateStatus('Cancelled')}
                  disabled={updating}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <span>Cancel Appointment</span>
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
