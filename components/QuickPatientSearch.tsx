'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, User, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  visits: Array<{
    visitDate: Date;
  }>;
}

interface QuickPatientSearchProps {
  onSelect?: (patient: Patient) => void;
  selectedPatient?: Patient | null;
  mode?: 'search' | 'select'; // 'search' for navbar, 'select' for appointment booking
}

const QuickPatientSearch = ({ onSelect, selectedPatient, mode = 'search' }: QuickPatientSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPatients = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Quick search: Patient name, phone, or ID (FC-XXX)..."
          className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-brand-teal border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-brand-teal rounded-lg shadow-xl max-h-96 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-3 py-2">Found {results.length} patient(s)</p>
            {results.map((patient) => (
              <div key={patient.id} className="p-3 hover:bg-brand-teal/5 rounded-lg transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-brand-teal text-sm">{patient.patientId}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-gray-900">{patient.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      {patient.age && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {patient.age} yrs, {patient.gender}
                        </span>
                      )}
                      {patient.contact && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {patient.contact}
                        </span>
                      )}
                      {patient.visits[0] && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Last: {new Date(patient.visits[0].visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {mode === 'select' && onSelect ? (
                      <button
                        onClick={() => {
                          onSelect(patient);
                          setShowResults(false);
                          setQuery('');
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all"
                      >
                        Select
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/patients/${patient.id}/visit/new`}
                          onClick={() => {
                            setShowResults(false);
                            setQuery('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all"
                        >
                          Add Visit
                        </Link>
                        <Link
                          href={`/patients/${patient.id}`}
                          onClick={() => {
                            setShowResults(false);
                            setQuery('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-brand-teal border-2 border-brand-teal hover:bg-brand-teal hover:text-white rounded-lg transition-all"
                        >
                          View
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-3">No patients found for "{query}"</p>
          {mode === 'select' ? (
            <div className="text-sm text-gray-600">
              <p className="mb-2">Patient not in system?</p>
              <Link
                href="/patients/new"
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-yellow hover:bg-brand-yellow/90 rounded-lg transition-all"
              >
                <span>Add New Patient First</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/patients/new"
              className="inline-block mt-2 text-sm text-brand-teal hover:underline"
            >
              Add new patient
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickPatientSearch;
