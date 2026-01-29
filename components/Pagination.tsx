'use client';

// FIX: Import React to use React.FC and other React features.
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
    // FIX: Create a new URLSearchParams instance from the existing one to make it mutable.
    const current = new URLSearchParams(searchParams);
    current.set('page', String(page));
    router.push(`${pathname}?${current.toString()}`);
  };

  const renderPageNumbers = () => {
    const pages = [];
    // Always show first page
    if (currentPage > 2) {
        pages.push(
          <button 
            key={1} 
            onClick={() => handlePageChange(1)} 
            className="px-3 py-2 text-sm rounded-lg hover:bg-brand-teal/10 hover:text-brand-teal transition-all font-medium"
          >
            1
          </button>
        );
        if (currentPage > 3) {
            pages.push(<span key="start-ellipsis" className="px-2 text-gray-400">...</span>);
        }
    }

    // Show current page and its neighbors
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        pages.push(
            <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  currentPage === i 
                    ? 'bg-brand-teal text-white shadow-md' 
                    : 'hover:bg-brand-teal/10 hover:text-brand-teal'
                }`}
            >
                {i}
            </button>
        );
    }
    
    // Always show last page
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            pages.push(<span key="end-ellipsis" className="px-2 text-gray-400">...</span>);
        }
        pages.push(
          <button 
            key={totalPages} 
            onClick={() => handlePageChange(totalPages)} 
            className="px-3 py-2 text-sm rounded-lg hover:bg-brand-teal/10 hover:text-brand-teal transition-all font-medium"
          >
            {totalPages}
          </button>
        );
    }

    return pages;
};

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-brand-teal bg-white p-3 sm:p-4 rounded-lg border-2 border-brand-teal">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-white border-2 border-brand-teal text-brand-teal rounded-lg hover:bg-brand-teal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-teal transition-all"
      >
        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        Previous
      </button>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <span className="text-xs sm:text-sm font-medium sm:hidden">
          Page {currentPage} of {totalPages}
        </span>
        <div className="hidden sm:flex items-center space-x-2">
          {renderPageNumbers()}
        </div>
      </div>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-white border-2 border-brand-teal text-brand-teal rounded-lg hover:bg-brand-teal hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-teal transition-all"
      >
        Next
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
      </button>
    </div>
  );
};

export default Pagination;