"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface Promotion {
  id: string
  name: string
  image_url: string | null
  price: number | null
  start_date: string
  end_date: string
  business_id: string
  is_active: boolean
  businesses: {
    name: string
  } | null
}

export default function ActivePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivePromotions()
  }, [])

  const loadActivePromotions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: promosData, error } = await supabase
        .from('promotions')
        .select('id, name, image_url, price, start_date, end_date, business_id, is_active')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('end_date', { ascending: true })
        .limit(3)

      if (error) {
        console.error('Error loading promotions:', error)
        setPromotions([])
        return
      }

      if (!promosData || promosData.length === 0) {
        setPromotions([])
        return
      }

      const businessIds = [...new Set(promosData.map(p => p.business_id))]
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('id, name')
        .in('id', businessIds)

      const businessesMap = new Map(businessesData?.map(b => [b.id, b]) || [])

      const enrichedPromos = promosData.map(promo => ({
        ...promo,
        businesses: businessesMap.get(promo.business_id) || null
      }))

      setPromotions(enrichedPromos)
    } catch (err) {
      console.error('Error loading promotions:', err)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Promociones Activas
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            No hay promociones activas
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ¡Vuelve pronto para descubrir ofertas!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-white/20 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Promociones Activas
        <span className="ml-auto text-xs font-normal px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
          {promotions.length}
        </span>
      </h3>

      <div className="space-y-3">
        {promotions.map((promo) => {
          const daysLeft = getDaysRemaining(promo.end_date)
          const businessName = promo.businesses?.name || 'Negocio'
          
          return (
            <Link 
              key={promo.id} 
              href={`/app/dashboard/negocios/${promo.business_id}`}
              className="block"
            >
              <div className="relative p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 border border-purple-500/30 hover:border-purple-400/50 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-red-500/20 transition-all duration-300 group overflow-hidden">
                {/* Animated gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
                
                <div className="relative">
                  {/* Title & Business */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-sm flex-1 group-hover:text-purple-300 transition-colors">
                      {promo.name}
                    </h4>
                    {daysLeft <= 3 && (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                        {daysLeft}d
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  <p className="text-xs text-purple-300 mb-2 font-medium">
                    📍 {businessName}
                  </p>

                  {/* Price */}
                  {promo.price && (
                    <p className="text-lg font-bold text-white mb-2">
                      ${promo.price.toFixed(2)}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {daysLeft > 3 
                        ? `Válido por ${daysLeft} días` 
                        : `¡Últimos días!`
                      }
                    </span>
                    <div className="flex items-center gap-1 text-purple-400 group-hover:gap-2 transition-all">
                      <span>Ver más</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {promotions.length > 0 && (
        <Link 
          href="/app/dashboard?filter=promotions" 
          className="block mt-4 text-center text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Ver todas las promociones →
        </Link>
      )}
    </div>
  )
}

