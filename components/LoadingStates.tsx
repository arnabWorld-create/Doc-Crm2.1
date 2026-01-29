'use client';

import { Loader2, Loader } from 'lucide-react';

/**
 * Full page loading spinner
 */
export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-teal mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
}

/**
 * Small loading spinner (for buttons, etc.)
 */
export function SmallLoader({ className = '' }: { className?: string }) {
  return (
    <Loader2 className={`animate-spin ${className}`} />
  );
}

/**
 * Skeleton loader for cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded mt-4"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded"></div>
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

/**
 * Loading overlay for modals/sections
 */
export function LoadingOverlay({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-teal mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Processing...</p>
      </div>
    </div>
  );
}

/**
 * Skeleton grid for multiple cards
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoader({ isLoading = false, children }: { isLoading?: boolean; children: React.ReactNode }) {
  if (!isLoading) return <>{children}</>;

  return (
    <span className="flex items-center gap-2">
      <SmallLoader className="w-4 h-4" />
      {children}
    </span>
  );
}
