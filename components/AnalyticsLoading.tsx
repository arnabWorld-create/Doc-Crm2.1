export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div>
        <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>

      {/* Key Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 p-6 rounded-xl h-32"></div>
        ))}
      </div>

      {/* Follow-up Tracking Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 p-6 rounded-xl h-32"></div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-200 p-6 rounded-xl h-96"></div>
        ))}
      </div>

      <div className="text-center text-gray-500 py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
        <p className="mt-2 text-sm">Loading analytics...</p>
      </div>
    </div>
  );
}
