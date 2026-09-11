// src/app/app/dashboard/chat/loading.tsx
export default function ChatLoading() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-black/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black/8 rounded-full animate-pulse" />
            <div className="h-6 w-28 bg-black/8 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-96 border-r border-black/8 flex flex-col">
          {/* Tab Bar Skeleton */}
          <div className="flex border-b border-black/8">
            <div className="flex-1 h-12 bg-black/5 animate-pulse" />
            <div className="flex-1 h-12 bg-black/5 animate-pulse border-l border-black/8" />
          </div>

          {/* Conversation Skeletons */}
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-black/5 animate-pulse"
              >
                <div className="w-12 h-12 bg-black/8 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-black/8 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-black/8 rounded w-full" />
                </div>
                <div className="h-3 w-10 bg-black/8 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area Skeleton — Desktop */}
        <div className="hidden lg:flex flex-1 flex-col">
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs p-4 rounded-2xl animate-pulse ${
                    i % 2 === 0 ? "bg-blue-500/20" : "bg-black/8"
                  }`}
                >
                  <div className="h-4 bg-black/8 rounded mb-2 w-48" />
                  <div className="h-4 bg-black/8 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-black/8">
            <div className="h-12 bg-black/8 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
