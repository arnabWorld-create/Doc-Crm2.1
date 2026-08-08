export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">

      {/* Hero header skeleton */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 h-36 sm:h-32" />

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-36">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="w-16 h-5 bg-gray-100 rounded-full" />
            </div>
            <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-28 mb-4" />
            <div className="h-px bg-gray-100 w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Follow-up strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 h-20">
            <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="h-6 bg-gray-100 rounded w-10 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 — 3+2 split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-4 bg-gray-100 rounded w-44 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
            <div className="w-9 h-9 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-52 bg-gray-50 rounded-xl" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-4 bg-gray-100 rounded w-36 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
            <div className="w-9 h-9 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-52 bg-gray-50 rounded-xl" />
        </div>
      </div>

      {/* Charts row 2 — demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-72">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="h-4 bg-gray-100 rounded w-40 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="w-9 h-9 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-44 bg-gray-50 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-48">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-100 rounded w-36" />
              <div className="w-9 h-9 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-10 bg-gray-100 rounded w-24 mb-4" />
            <div className="space-y-2">
              <div className="h-2.5 bg-gray-100 rounded-full w-full" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Medical charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="h-4 bg-gray-100 rounded w-44 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
              <div className="w-9 h-9 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-52 bg-gray-50 rounded-xl" />
          </div>
        ))}
      </div>

    </div>
  );
}
