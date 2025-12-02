// src/app/app/dashboard/loading.tsx
// Skeleton de carga para el dashboard principal
export default function DashboardLoading() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-transparent backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl animate-pulse" />
              <div className="w-32 h-6 bg-white/10 rounded-lg animate-pulse" />
            </div>

            {/* Right buttons skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-6">
          {/* Sidebar izquierdo - Desktop */}
          <aside className="hidden lg:block w-72 space-y-4">
            <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-6">
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-white/10 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 space-y-6">
            {/* Tabs skeleton */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-32 bg-white/10 rounded-full animate-pulse" />
              ))}
            </div>

            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-6 animate-pulse"
                >
                  {/* Logo skeleton */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-white/10 rounded mb-2 w-3/4" />
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>

                  {/* Rating skeleton */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-4 h-4 bg-white/10 rounded" />
                      ))}
                    </div>
                    <div className="h-4 w-12 bg-white/10 rounded" />
                  </div>

                  {/* Description skeleton */}
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                    <div className="h-3 bg-white/10 rounded w-4/6" />
                  </div>

                  {/* Action buttons skeleton */}
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-white/10 rounded-full" />
                    <div className="h-9 w-9 bg-white/10 rounded-full" />
                    <div className="h-9 w-9 bg-white/10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Sidebar derecho - Desktop */}
          <aside className="hidden xl:block w-80 space-y-4">
            <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-6">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

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



