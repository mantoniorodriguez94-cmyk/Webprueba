// src/app/app/dashboard/mis-negocios/loading.tsx
// Skeleton de carga para la página de mis negocios
export default function MisNegociosLoading() {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header Skeleton */}
      <header className="bg-transparent backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
              <div>
                <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar Skeleton */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl border-2 border-white/20 p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="h-5 w-24 bg-white/10 rounded" />
          </div>
          <div className="h-3 bg-white/10 rounded-full w-full" />
        </div>

        {/* Create Button Skeleton */}
        <div className="mb-8">
          <div className="h-14 w-full sm:w-64 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl animate-pulse" />
        </div>

        {/* Business Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-transparent backdrop-blur-sm rounded-3xl border-2 border-white/20 overflow-hidden animate-pulse"
            >
              {/* Image skeleton */}
              <div className="h-48 bg-white/10" />

              {/* Content */}
              <div className="p-6">
                {/* Title */}
                <div className="h-6 bg-white/10 rounded mb-3 w-3/4" />

                {/* Category */}
                <div className="h-4 bg-white/10 rounded mb-4 w-1/2" />

                {/* Stats */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/10 rounded" />
                    <div className="h-4 w-12 bg-white/10 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/10 rounded" />
                    <div className="h-4 w-12 bg-white/10 rounded" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-blue-500/20 rounded-xl" />
                  <div className="h-10 bg-purple-500/20 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav Skeleton - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-transparent backdrop-blur-sm border-t border-white/20">
        <div className="flex items-center justify-around px-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
              <div className="w-12 h-3 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


