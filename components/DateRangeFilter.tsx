'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const DateRangeFilter = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') || '');
  
  // Parse month into separate month and year
  const [filterMonth, setFilterMonth] = useState(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      return month;
    }
    return '';
  });
  
  const [filterYear, setFilterYear] = useState(() => {
    if (selectedMonth) {
      const [year] = selectedMonth.split('-');
      return year;
    }
    return new Date().getFullYear().toString();
  });

  // Month names
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate year options (last 5 years + current + next 2 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i.toString());
    }
    return years;
  };

  const years = generateYears();

  // Update selectedMonth when month or year changes
  const handleMonthYearChange = (month: string, year: string) => {
    if (month && year) {
      setSelectedMonth(`${year}-${month}`);
    } else {
      setSelectedMonth('');
    }
  };

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    
    if (startDate) {
      params.set('startDate', startDate);
    } else {
      params.delete('startDate');
    }
    
    if (endDate) {
      params.set('endDate', endDate);
    } else {
      params.delete('endDate');
    }
    
    if (selectedMonth) {
      params.set('month', selectedMonth);
    } else {
      params.delete('month');
    }
    
    replace(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setFilterMonth('');
    setFilterYear(new Date().getFullYear().toString());
    const params = new URLSearchParams(searchParams);
    params.delete('startDate');
    params.delete('endDate');
    params.delete('month');
    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
  };

  const handleMonthChange = (month: string) => {
    setFilterMonth(month);
    handleMonthYearChange(month, filterYear);
    if (month) {
      // Clear date range when month is selected
      setStartDate('');
      setEndDate('');
    }
  };

  const handleYearChange = (year: string) => {
    setFilterYear(year);
    handleMonthYearChange(filterMonth, year);
    if (year && filterMonth) {
      // Clear date range when year is selected
      setStartDate('');
      setEndDate('');
    }
  };

  const handleDateChange = () => {
    // Clear month when date range is used
    if (startDate || endDate) {
      setSelectedMonth('');
    }
  };

  useEffect(() => {
    handleDateChange();
  }, [startDate, endDate]);

  const hasActiveFilter = startDate || endDate || selectedMonth;

  return (
    <div>
      {/* Mobile Layout */}
      <div className="lg:hidden bg-white p-3 rounded-lg border-2 border-gray-200 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <Calendar className="h-4 w-4" />
            <span>Filter by Date</span>
          </div>
          {hasActiveFilter && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-all"
              title="Clear filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Month and Year */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="monthSelect" className="block text-xs font-medium text-gray-600">
              Month:
            </label>
            <select
              id="monthSelect"
              value={filterMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all bg-white"
            >
              <option value="">Select</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="yearSelect" className="block text-xs font-medium text-gray-600">
              Year:
            </label>
            <select
              id="yearSelect"
              value={filterYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="startDate" className="block text-xs font-medium text-gray-600">
              From:
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!!selectedMonth}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="endDate" className="block text-xs font-medium text-gray-600">
              To:
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!!selectedMonth}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleFilter}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all shadow-sm hover:shadow"
        >
          Apply Filter
        </button>
      </div>

      {/* Desktop Layout - Inline */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-teal">
          <Calendar className="h-3.5 w-3.5" />
          <span>Filter by Date:</span>
        </div>

        {/* Month and Year */}
        <div className="flex items-center gap-1">
          <label htmlFor="monthSelectDesktop" className="text-xs text-gray-600">
            Month:
          </label>
          <select
            id="monthSelectDesktop"
            value={filterMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-teal bg-white"
          >
            <option value="">Select</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          
          <select
            id="yearSelectDesktop"
            value={filterYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-teal bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-400">OR</span>

        {/* Date Range */}
        <div className="flex items-center gap-1">
          <label htmlFor="startDateDesktop" className="text-xs text-gray-600">
            From:
          </label>
          <input
            id="startDateDesktop"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={!!selectedMonth}
            className="w-36 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-teal disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <label htmlFor="endDateDesktop" className="text-xs text-gray-600">
            To:
          </label>
          <input
            id="endDateDesktop"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={!!selectedMonth}
            className="w-36 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-teal disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Apply Button */}
        <button
          onClick={handleFilter}
          className="px-3 py-1 text-xs font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded transition-all"
        >
          Apply
        </button>

        {/* Clear Button */}
        {hasActiveFilter && (
          <button
            onClick={handleClear}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
            title="Clear filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
