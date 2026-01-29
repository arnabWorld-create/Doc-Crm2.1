'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  consultationDate?: Date | null;
  followUpDate?: Date | null;
}

interface CalendarViewProps {
  consultations: Patient[];
  followUps: Patient[];
  currentMonth: number;
  currentYear: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  consultations,
  followUps,
  currentMonth,
  currentYear,
}) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Pre-index events by date for O(1) lookup instead of O(n) filtering
  const eventsByDate = new Map<string, { consultations: Patient[]; followUps: Patient[] }>();
  
  consultations.forEach(p => {
    if (!p.consultationDate) return;
    const pDate = new Date(p.consultationDate);
    if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      const key = pDate.getDate().toString();
      if (!eventsByDate.has(key)) {
        eventsByDate.set(key, { consultations: [], followUps: [] });
      }
      eventsByDate.get(key)!.consultations.push(p);
    }
  });

  followUps.forEach(p => {
    if (!p.followUpDate) return;
    const pDate = new Date(p.followUpDate);
    if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      const key = pDate.getDate().toString();
      if (!eventsByDate.has(key)) {
        eventsByDate.set(key, { consultations: [], followUps: [] });
      }
      eventsByDate.get(key)!.followUps.push(p);
    }
  });

  const handlePrevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    router.push(`/calendar?month=${newMonth}&year=${newYear}`);
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    router.push(`/calendar?month=${newMonth}&year=${newYear}`);
  };

  const getEventsForDate = (day: number) => {
    return eventsByDate.get(day.toString()) || { consultations: [], followUps: [] };
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOfMonth + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const isToday = isCurrentMonth &&
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      if (isCurrentMonth) {
        const events = getEventsForDate(day);
        const hasEvents = events.consultations.length > 0 || events.followUps.length > 0;

        days.push(
          <button
            key={i}
            onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
            className={`min-h-24 sm:min-h-28 p-2 border border-gray-200 hover:bg-gray-50 transition-all ${isToday ? 'bg-brand-teal/10 border-brand-teal' : 'bg-white'
              } ${hasEvents ? 'cursor-pointer' : ''}`}
          >
            <div className="flex flex-col h-full">
              <span className={`text-sm sm:text-base font-semibold mb-1 ${isToday ? 'text-brand-teal' : 'text-gray-700'
                }`}>
                {day}
              </span>
              {events.consultations.length > 0 && (
                <div className="text-xs bg-brand-teal text-white px-1.5 py-0.5 rounded mb-1">
                  {events.consultations.length} Consult
                </div>
              )}
              {events.followUps.length > 0 && (
                <div className="text-xs bg-brand-yellow text-white px-1.5 py-0.5 rounded">
                  {events.followUps.length} Follow-up
                </div>
              )}
            </div>
          </button>
        );
      } else {
        days.push(
          <div key={i} className="min-h-24 sm:min-h-28 p-2 border border-gray-100 bg-gray-50"></div>
        );
      }
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate.getDate()) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-teal">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-brand-teal rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Consultation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-brand-yellow rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Follow-up</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-brand-teal/10 border-2 border-brand-teal rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-brand-teal mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          {selectedDate ? selectedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : 'Select a Date'}
        </h3>

        {selectedDateEvents ? (
          <div className="space-y-4">
            {/* Consultations */}
            {selectedDateEvents.consultations.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-brand-teal mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Consultations ({selectedDateEvents.consultations.length})
                </h4>
                <div className="space-y-2">
                  {selectedDateEvents.consultations.map(patient => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="block p-3 bg-brand-teal/5 hover:bg-brand-teal/10 rounded-lg border border-brand-teal/20 transition-colors"
                    >
                      <p className="font-semibold text-brand-teal text-sm">{patient.name}</p>
                      <p className="text-xs text-gray-600">
                        {patient.age && `${patient.age} yrs`} {patient.gender && `• ${patient.gender}`}
                      </p>
                      {patient.contact && (
                        <p className="text-xs text-gray-500 mt-1">{patient.contact}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-ups */}
            {selectedDateEvents.followUps.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-brand-yellow mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Follow-ups ({selectedDateEvents.followUps.length})
                </h4>
                <div className="space-y-2">
                  {selectedDateEvents.followUps.map(patient => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="block p-3 bg-brand-yellow/5 hover:bg-brand-yellow/10 rounded-lg border border-brand-yellow/20 transition-colors"
                    >
                      <p className="font-semibold text-brand-yellow text-sm">{patient.name}</p>
                      <p className="text-xs text-gray-600">
                        {patient.age && `${patient.age} yrs`} {patient.gender && `• ${patient.gender}`}
                      </p>
                      {patient.contact && (
                        <p className="text-xs text-gray-500 mt-1">{patient.contact}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {selectedDateEvents.consultations.length === 0 && selectedDateEvents.followUps.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments on this date</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click on a date to view appointments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
