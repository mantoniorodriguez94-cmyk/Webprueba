"use client"

/**
 * Right Sidebar - Dashboard
 * Componente modular que muestra información relevante y actualizada
 * Diseñado para desktop (hidden lg:block)
 */

import TopRatedBusinesses from "./TopRatedBusinesses"
import PromotionsSpotlight from "../PromotionsSpotlight"
import CommunityFeed from "./CommunityFeed"

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto space-y-5 pb-6 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent">
      {/* Top Rated Businesses */}
      <TopRatedBusinesses />

      {/* La vitrina dorada, la misma que usa la pestaña "Promociones" del
          móvil. Antes acá había ActivePromotions, otro componente que leía lo
          mismo y lo pintaba distinto — y que rotaba solo cada segundo, así que
          no daba tiempo a leer una promoción antes de que cambiara. Una sola
          vitrina, un solo sitio por tamaño de pantalla: el rail en escritorio,
          el chip en móvil, nunca las dos a la vez. */}
      <PromotionsSpotlight />

      {/* Community Feed */}
      <CommunityFeed />
    </aside>
  )
}

