'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Users, Clock, Stethoscope } from 'lucide-react';
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView: React.FC<CalendarViewProps> = ({
  consultations,
  followUps,
  currentMonth,
  currentYear,
}) => {
  const router = useRouter();
  const today = new Date();

  // Default selected date = today if viewing current month, else null
  const defaultSelected =
    today.getMonth() === currentMonth && today.getFullYear() === currentYear
      ? today
      : null;
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultSelected);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Build O(1) lookup map
  const eventsByDate = new Map<string, { consultations: Patient[]; followUps: Patient[] }>();

  consultations.forEach((p) => {
    if (!p.consultationDate) return;
    const d = new Date(p.consultationDate);
    if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
    const key = d.getDate().toString();
    if (!eventsByDate.has(key)) eventsByDate.set(key, { consultations: [], followUps: [] });
    eventsByDate.get(key)!.consultations.push(p);
  });

  followUps.forEach((p) => {
    if (!p.followUpDate) return;
    const d = new Date(p.followUpDate);
    if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
    const key = d.getDate().toString();
    if (!eventsByDate.has(key)) eventsByDate.set(key, { consultations: [], followUps: [] });
    eventsByDate.get(key)!.followUps.push(p);
  });

  const getEventsForDate = (day: number) =>
    eventsByDate.get(day.toString()) || { consultations: [], followUps: [] };

  const handlePrevMonth = () => {
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    router.push(`/calendar?month=${m}&year=${y}`);
  };
  const handleNextMonth = () => {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    router.push(`/calendar?month=${m}&year=${y}`);
  };
  const handleToday = () => {
    router.push(`/calendar?month=${today.getMonth()}&year=${today.getFullYear()}`);
  };

  // Month-level totals for summary badges
  const totalConsultations = consultations.length;
  const totalFollowUps = followUps.length;

  const renderCalendarDays = () => {
    const cells = [];
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOfMonth + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;

      if (!isCurrentMonth) {
        cells.push(
          <div key={i} className="min-h-[5.5rem] p-1.5 rounded-lg bg-gray-50/60" />
        );
        continue;
      }

      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      const isSelected =
        selectedDate &&
        day === selectedDate.getDate() &&
        currentMonth === selectedDate.getMonth() &&
        currentYear === selectedDate.getFullYear();

      const events = getEventsForDate(day);
      const hasConsult = events.consultations.length > 0;
      const hasFollowUp = events.followUps.length > 0;

      cells.push(
        <button
          key={i}
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
          className={`min-h-[5.5rem] p-2 rounded-lg border text-left transition-all flex flex-col
            ${isSelected
              ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/30'
              : isToday
              ? 'border-brand-teal/40 bg-brand-teal/5'
              : 'border-gray-100 bg-white hover:border-brand-teal/30 hover:bg-brand-teal/[0.02]'
            }`}
        >
          {/* Date number */}
          <span
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 flex-shrink-0
              ${isToday
                ? 'bg-brand-teal text-white'
                : isSelected
                ? 'text-brand-teal font-bold'
                : 'text-gray-700'
              }`}
          >
            {day}
          </span>

          {/* Event pills */}
          <div className="flex flex-col gap-0.5 w-full">
            {hasConsult && (
              <span className="text-[10px] leading-tight bg-brand-teal text-white px-1.5 py-0.5 rounded font-medium truncate">
                {events.consultations.length} Consult{events.consultations.length > 1 ? 's' : ''}
              </span>
            )}
            {hasFollowUp && (
              <span className="text-[10px] leading-tight bg-brand-yellow text-white px-1.5 py-0.5 rounded font-medium truncate">
                {events.followUps.length} Follow-up{events.followUps.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </button>
      );
    }
    return cells;
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getDate())
    : null;

  const selectedHasEvents =
    selectedDateEvents &&
    (selectedDateEvents.consultations.length > 0 || selectedDateEvents.followUps.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

      {/* ── Main Calendar ── */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Calendar header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {MONTH_NAMES[currentMonth]}{' '}
              <span className="text-brand-teal">{currentYear}</span>
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-teal inline-block" />
                {totalConsultations} consultation{totalConsultations !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-yellow inline-block" />
                {totalFollowUps} follow-up{totalFollowUps !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg hover:bg-brand-teal hover:text-white transition-all"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-all"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* Day name headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-1.5 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">

        {/* Panel header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-0.5">
            <CalendarDays className="h-4 w-4 text-brand-teal" />
            <h3 className="text-sm font-bold text-gray-800">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a date'}
            </h3>
          </div>
          {selectedDate && (
            <p className="text-xs text-gray-400 ml-6">{currentYear}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-300">
              <CalendarDays className="h-14 w-14 mb-3" />
              <p className="text-sm font-medium text-gray-400">Click a date to view</p>
              <p className="text-xs text-gray-300 mt-1">appointments for that day</p>
            </div>
          ) : !selectedHasEvents ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-300">
              <CalendarDays className="h-14 w-14 mb-3" />
              <p className="text-sm font-medium text-gray-400">No appointments</p>
              <p className="text-xs text-gray-300 mt-1">Nothing scheduled on this day</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Consultations */}
              {selectedDateEvents!.consultations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-3.5 w-3.5 text-brand-teal" />
                    <span className="text-xs font-semibold text-brand-teal uppercase tracking-wide">
                      Consultations
                    </span>
                    <span className="ml-auto text-xs font-bold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full">
                      {selectedDateEvents!.consultations.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedDateEvents!.consultations.map((patient) => (
                      <Link
                        key={patient.id}
                        href={`/patients/${patient.id}`}
                        className="block p-3 rounded-lg border border-brand-teal/20 bg-brand-teal/[0.03] hover:bg-brand-teal/[0.07] hover:border-brand-teal/40 transition-all"
                      >
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{patient.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[patient.age ? `${patient.age} yrs` : null, patient.gender]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {patient.contact && (
                          <p className="text-xs text-gray-400 mt-0.5">{patient.contact}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-ups */}
              {selectedDateEvents!.followUps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3.5 w-3.5 text-brand-yellow" />
                    <span className="text-xs font-semibold text-brand-yellow uppercase tracking-wide">
                      Follow-ups
                    </span>
                    <span className="ml-auto text-xs font-bold bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded-full">
                      {selectedDateEvents!.followUps.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedDateEvents!.followUps.map((patient) => (
                      <Link
                        key={patient.id}
                        href={`/patients/${patient.id}`}
                        className="block p-3 rounded-lg border border-brand-yellow/20 bg-brand-yellow/[0.03] hover:bg-brand-yellow/[0.07] hover:border-brand-yellow/40 transition-all"
                      >
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{patient.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[patient.age ? `${patient.age} yrs` : null, patient.gender]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {patient.contact && (
                          <p className="text-xs text-gray-400 mt-0.5">{patient.contact}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Legend footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-brand-teal inline-block" />
            Consultation
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-brand-yellow inline-block" />
            Follow-up
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-5 h-5 rounded-full bg-brand-teal inline-flex items-center justify-center text-white text-[9px] font-bold">7</span>
            Today
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
