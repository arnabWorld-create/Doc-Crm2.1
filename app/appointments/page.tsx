'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Plus, Filter, User, Phone } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, past
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, [filter, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = '/api/appointments?';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filter === 'today') {
        url += `date=${today.toISOString().split('T')[0]}`;
      } else if (filter === 'upcoming') {
        url += `startDate=${today.toISOString().split('T')[0]}`;
      } else if (filter === 'past') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        url += `endDate=${yesterday.toISOString().split('T')[0]}`;
      }
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        console.error('API returned non-array data:', data);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Confirmed':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      case 'No-Show':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-teal mb-2">
            Appointments
          </h1>
          <p className="text-gray-600">Manage patient appointments and schedules</p>
        </div>
        <Link href="/appointments/new">
          <button className="flex items-center space-x-2 px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors shadow-md">
            <Plus className="h-5 w-5" />
            <span>Book Appointment</span>
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
            >
              <option value="all">All Appointments</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-Show">No-Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No appointments found</p>
            <Link href="/appointments/new">
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Book First Appointment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}`}
                className="block"
              >
                <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-brand-teal hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          {appointment.appointmentType}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-brand-teal" />
                        <span className="font-semibold text-brand-teal">
                          {appointment.patient ? appointment.patient.name : appointment.tempPatientName}
                        </span>
                        {appointment.patient && (
                          <span className="text-sm text-gray-600">
                            ({appointment.patient.patientId})
                          </span>
                        )}
                        {!appointment.patient && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                            Walk-in
                          </span>
                        )}
                      </div>

                      {(appointment.patient?.contact || appointment.tempPatientContact) && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.patient?.contact || appointment.tempPatientContact}</span>
                        </div>
                      )}

                      {appointment.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-semibold">Reason:</span> {appointment.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 text-brand-teal">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold">
                          {formatDate(appointment.appointmentDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">
                          {appointment.appointmentTime}
                        </span>
                        <span className="text-sm">({appointment.duration} min)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
