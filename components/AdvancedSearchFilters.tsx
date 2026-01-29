'use client';

import { useState, useCallback } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export interface SearchFilters {
  search?: string;
  gender?: string;
  ageRange?: string;
  bloodGroup?: string;
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function AdvancedSearchFilters({ onFiltersChange, isLoading = false }: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  const handleSearchChange = (value: string) => {
    handleFilterChange({ ...filters, search: value });
  };

  const handleGenderChange = (value: string) => {
    handleFilterChange({ ...filters, gender: value || undefined });
  };

  const handleAgeRangeChange = (value: string) => {
    handleFilterChange({ ...filters, ageRange: value || undefined });
  };

  const handleBloodGroupChange = (value: string) => {
    handleFilterChange({ ...filters, bloodGroup: value || undefined });
  };

  const handleSortChange = (value: string) => {
    handleFilterChange({ ...filters, sortBy: value || undefined });
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    handleFilterChange({ ...filters, sortOrder: value });
  };

  const handleToggleAllergies = () => {
    handleFilterChange({ ...filters, hasAllergies: !filters.hasAllergies });
  };

  const handleToggleChronicConditions = () => {
    handleFilterChange({ ...filters, hasChronicConditions: !filters.hasChronicConditions });
  };

  const handleClearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== false).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or contact..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all disabled:opacity-50"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
            showAdvanced
              ? 'bg-brand-teal text-white border-brand-teal'
              : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-brand-yellow text-white text-xs rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 rounded-lg border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 font-medium transition-all"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleGenderChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all disabled:opacity-50"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Age Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
              <select
                value={filters.ageRange || ''}
                onChange={(e) => handleAgeRangeChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all disabled:opacity-50"
              >
                <option value="">All Ages</option>
                <option value="0-18">0-18 years</option>
                <option value="19-35">19-35 years</option>
                <option value="36-50">36-50 years</option>
                <option value="51-65">51-65 years</option>
                <option value="65+">65+ years</option>
              </select>
            </div>

            {/* Blood Group Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
              <select
                value={filters.bloodGroup || ''}
                onChange={(e) => handleBloodGroupChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all disabled:opacity-50"
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy || ''}
                onChange={(e) => handleSortChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all disabled:opacity-50"
              >
                <option value="">Default</option>
                <option value="name">Name</option>
                <option value="age">Age</option>
                <option value="createdAt">Registration Date</option>
                <option value="visits">Number of Visits</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasAllergies || false}
                onChange={handleToggleAllergies}
                disabled={isLoading}
                className="w-4 h-4 rounded border-2 border-gray-300 text-brand-teal focus:ring-2 focus:ring-brand-teal/20 cursor-pointer disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">Has Allergies</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasChronicConditions || false}
                onChange={handleToggleChronicConditions}
                disabled={isLoading}
                className="w-4 h-4 rounded border-2 border-gray-300 text-brand-teal focus:ring-2 focus:ring-brand-teal/20 cursor-pointer disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">Has Chronic Conditions</span>
            </label>

            {/* Sort Order */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Order:</span>
              <button
                onClick={() => handleSortOrderChange(filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                disabled={isLoading}
                className={`px-3 py-1 rounded border-2 text-sm font-medium transition-all ${
                  filters.sortOrder === 'asc'
                    ? 'bg-brand-teal text-white border-brand-teal'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
                } disabled:opacity-50`}
              >
                {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
