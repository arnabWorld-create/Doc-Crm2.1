'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Stethoscope, Users, Activity, Calendar, Settings, CalendarCheck, LogOut, Menu, X, CreditCard, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import React, { useState, useEffect, useRef } from 'react';

const Navbar = () => {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctorName, setDoctorName] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch doctor name from clinic profile
  useEffect(() => {
    const fetchDoctorName = async () => {
      try {
        const response = await fetch('/api/clinic-profile');
        if (response.ok) {
          const profile = await response.json();
          // Use doctorName from profile, fallback to user name
          setDoctorName(profile.doctorName || user?.name || 'Doctor');
        }
      } catch (error) {
        // Fallback to user name
        setDoctorName(user?.name || 'Doctor');
      }
    };

    if (isAuthenticated) {
      fetchDoctorName();
    }
  }, [isAuthenticated, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Don't show navbar on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  // Don't show navbar while loading or if not authenticated
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white border-b-2 border-brand-teal shadow-sm rounded-b-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-8">
            <Link href="/patients" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="bg-brand-red p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-brand-teal">
                DoXcia
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/patients" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-teal hover:bg-brand-teal hover:text-white transition-all font-medium">
                <Users className="h-4 w-4" />
                <span>Patients</span>
              </Link>
              <Link href="/appointments" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-teal hover:bg-brand-teal hover:text-white transition-all font-medium">
                <CalendarCheck className="h-4 w-4" />
                <span>Appointments</span>
              </Link>
              <Link href="/calendar" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-teal hover:bg-brand-teal hover:text-white transition-all font-medium">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </Link>
              <Link href="/analytics" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-teal hover:bg-brand-teal hover:text-white transition-all font-medium">
                <Activity className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
              <Link href="/payments" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-teal hover:bg-brand-teal hover:text-white transition-all font-medium">
                <CreditCard className="h-4 w-4" />
                <span>FinX</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-brand-teal hover:bg-brand-teal/10 transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-white rounded-lg border-2 border-brand-teal hover:bg-brand-teal/5 transition"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-brand-teal rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {doctorName?.charAt(0).toUpperCase() || 'D'}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-brand-teal truncate max-w-[150px]">
                  {doctorName || 'Doctor'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border-2 border-brand-teal top-full z-50">
                  <div className="p-4 border-b-2 border-gray-100">
                    <p className="text-sm font-semibold text-brand-teal">{doctorName || user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/settings/profile"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-brand-teal hover:bg-brand-teal/10 transition font-medium text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      href="/settings/clinic"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-brand-teal hover:bg-brand-teal/10 transition font-medium text-sm"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Clinic Settings</span>
                    </Link>
                    <Link
                      href="/settings/fees"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-brand-teal hover:bg-brand-teal/10 transition font-medium text-sm"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Fee Management</span>
                    </Link>
                    <Link
                      href="/settings/import"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-brand-teal hover:bg-brand-teal/10 transition font-medium text-sm"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import Data</span>
                    </Link>
                    <Link
                      href="/settings/export"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-brand-teal hover:bg-brand-teal/10 transition font-medium text-sm"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V3" />
                      </svg>
                      <span>Export Data</span>
                    </Link>
                  </div>
                  <div className="border-t-2 border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 transition font-medium text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-gray-100">
            <div className="flex flex-col space-y-2">
              <Link
                href="/patients"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/patients' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Patients</span>
              </Link>
              <Link
                href="/appointments"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/appointments' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <CalendarCheck className="h-5 w-5" />
                <span>Appointments</span>
              </Link>
              <Link
                href="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/calendar' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </Link>
              <Link
                href="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/analytics' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <Activity className="h-5 w-5" />
                <span>Analytics</span>
              </Link>
              <Link
                href="/payments"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/payments' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>FinX</span>
              </Link>
              <Link
                href="/settings/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/settings/profile' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <Link
                href="/settings/clinic"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  pathname === '/settings/clinic' 
                    ? 'bg-brand-teal text-white' 
                    : 'text-brand-teal hover:bg-brand-teal/10'
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span>Clinic Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;