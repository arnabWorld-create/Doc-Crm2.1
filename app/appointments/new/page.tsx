'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, Plus } from 'lucide-react';
import Link from 'next/link';
import QuickPatientSearch from '@/components/QuickPatientSearch';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [useWalkIn, setUseWalkIn] = useState(false);
  const [formData, setFormData] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    duration: 30,
    appointmentType: 'Consultation',
    status: 'Scheduled',
    reason: '',
    notes: '',
    tempPatientName: '',
    tempPatientContact: '',
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: either patient selected OR walk-in name provided
    if (!selectedPatient && !useWalkIn) {
      alert('Please select a patient or use walk-in mode');
      return;
    }
    
    if (useWalkIn && !formData.tempPatientName.trim()) {
      alert('Please enter patient name for walk-in appointment');
      return;
    }

    setLoading(true);
    try {
      const appointmentData: any = {
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        duration: formData.duration,
        appointmentType: formData.appointmentType,
        status: formData.status,
        reason: formData.reason,
        notes: formData.notes,
      };

      if (selectedPatient) {
        appointmentData.patientId = selectedPatient.id;
      } else {
        appointmentData.tempPatientName = formData.tempPatientName;
        appointmentData.tempPatientContact = formData.tempPatientContact;
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        router.push('/appointments');
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Failed to create appointment: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-teal mb-2">
            Book Appointment
          </h1>
          <p className="text-gray-600">Schedule a new patient appointment</p>
        </div>
        <Link href="/appointments">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center space-x-3 mb-4 pb-4 border-b-2 border-brand-teal">
            <div className="p-3 bg-brand-teal rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-brand-teal">Select Patient</h3>
          </div>

          {/* Toggle between existing patient and walk-in */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setUseWalkIn(false);
                setFormData({ ...formData, tempPatientName: '', tempPatientContact: '' });
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !useWalkIn
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Existing Patient
            </button>
            <button
              type="button"
              onClick={() => {
                setUseWalkIn(true);
                setSelectedPatient(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                useWalkIn
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Walk-in / New Patient
            </button>
          </div>

          {!useWalkIn ? (
            <>
              <QuickPatientSearch
                onSelect={(patient) => setSelectedPatient(patient)}
                selectedPatient={selectedPatient}
                mode="select"
              />

              {selectedPatient && (
                <div className="mt-4 p-4 bg-brand-teal/10 rounded-lg border-2 border-brand-teal">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-teal">{selectedPatient.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.patientId} • {selectedPatient.age} years • {selectedPatient.gender}
                      </p>
                      {selectedPatient.contact && (
                        <p className="text-sm text-gray-600">{selectedPatient.contact}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Walk-in Mode:</strong> Enter basic details now. Full patient record will be created when you mark the appointment as completed.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-teal mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={formData.tempPatientName}
                  onChange={(e) => setFormData({ ...formData, tempPatientName: e.target.value })}
                  required
                  placeholder="Enter patient name"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-teal mb-2">
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.tempPatientContact}
                  onChange={(e) => setFormData({ ...formData, tempPatientContact: e.target.value })}
                  placeholder="+91-9876543210"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                />
              </div>
            </div>
          )}


        </div>

        {/* Appointment Details */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
          <div className="flex items-center space-x-3 mb-4 pb-4 border-b-2 border-brand-yellow">
            <div className="p-3 bg-brand-yellow rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-brand-yellow">Appointment Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Appointment Date *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Appointment Time *
              </label>
              <select
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Appointment Type
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
              >
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Check-up">Check-up</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Reason for Visit
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="e.g., Fever, Cough, Routine check-up..."
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none resize-none"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-brand-teal mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Internal notes for staff..."
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/appointments">
            <button
              type="button"
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading || (!selectedPatient && !useWalkIn) || (useWalkIn && !formData.tempPatientName.trim())}
            className="px-8 py-3 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
