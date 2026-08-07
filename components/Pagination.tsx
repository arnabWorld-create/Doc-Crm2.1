'use client';

import React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const current = new URLSearchParams(searchParams);
    current.set('page', String(page));
    router.push(`${pathname}?${current.toString()}`);
  };

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];

    if (currentPage > 2) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="w-8 h-8 flex items-center justify-center text-sm rounded-lg hover:bg-brand-teal/10 hover:text-brand-teal transition-all font-medium text-gray-600"
        >
          1
        </button>
      );
      if (currentPage > 3) {
        pages.push(
          <span key="start-ellipsis" className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        );
      }
    }

    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all ${
            currentPage === i
              ? 'bg-brand-teal text-white shadow-sm'
              : 'text-gray-600 hover:bg-brand-teal/10 hover:text-brand-teal'
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        pages.push(
          <span key="end-ellipsis" className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="w-8 h-8 flex items-center justify-center text-sm rounded-lg hover:bg-brand-teal/10 hover:text-brand-teal transition-all font-medium text-gray-600"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100">
      {/* Previous */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:border-brand-teal hover:text-brand-teal hover:bg-brand-teal/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page numbers — desktop */}
      <div className="hidden sm:flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      {/* Page indicator — mobile */}
      <span className="sm:hidden text-sm text-gray-500 font-medium">
        Page <span className="text-brand-teal font-semibold">{currentPage}</span> of {totalPages}
      </span>

      {/* Next */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:border-brand-teal hover:text-brand-teal hover:bg-brand-teal/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-all"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
