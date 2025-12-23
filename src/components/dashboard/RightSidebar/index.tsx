"use client"

/**
 * Right Sidebar - Dashboard
 * Componente modular que muestra información relevante y actualizada
 * Diseñado para desktop (hidden lg:block)
 */

import TopRatedBusinesses from "./TopRatedBusinesses"
import ActivePromotions from "./ActivePromotions"
import CommunityFeed from "./CommunityFeed"

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto space-y-5 pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Top Rated Businesses */}
      <TopRatedBusinesses />

      {/* Active Promotions */}
      <ActivePromotions />

      {/* Community Feed */}
      <CommunityFeed />
    </aside>
  )
}

