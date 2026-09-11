// src/app/app/dashboard/mis-mensajes/loading.tsx
// Skeleton de carga para la página de mensajes
export default function MisMensajesLoading() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-black/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 bg-black/8 rounded animate-pulse" />
            <div className="w-9 h-9 bg-black/8 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
        <div className="flex h-full">
          {/* Conversations List Skeleton */}
          <div className="w-full lg:w-96 border-r border-black/8 bg-transparent backdrop-blur-sm">
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-black/5 animate-pulse"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-black/8 rounded-full flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-black/8 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-black/8 rounded w-full" />
                  </div>

                  {/* Time */}
                  <div className="h-3 w-12 bg-black/8 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area Skeleton - Desktop */}
          <div className="hidden lg:flex flex-1 flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-black/8 flex items-center gap-3">
              <div className="w-10 h-10 bg-black/8 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-black/8 rounded mb-2 w-32" />
                <div className="h-3 bg-black/8 rounded w-24" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-4 rounded-2xl ${
                      i % 2 === 0 ? 'bg-blue-500/20' : 'bg-black/8'
                    } animate-pulse`}
                  >
                    <div className="h-4 bg-black/8 rounded mb-2 w-48" />
                    <div className="h-4 bg-black/8 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-black/8">
              <div className="flex gap-3">
                <div className="flex-1 h-12 bg-black/8 rounded-full animate-pulse" />
                <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Skeleton - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 backdrop-blur-sm border-t border-black/8">
        <div className="flex items-center justify-around px-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-black/8 rounded animate-pulse" />
              <div className="w-12 h-3 bg-black/8 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




