"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { SUBSCRIPTION_TIER_FUNDADOR } from "@/lib/memberships/tiers"

interface Promotion {
  id: string
  name: string
  start_date: string
  end_date: string
  business_id: string
  businesses: {
    name: string
  } | null
}

const ROTATION_INTERVAL_MS = 1000

export default function ActivePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    loadActivePromotions()
  }, [])

  const loadActivePromotions = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data: promotionsData, error: promotionsError } = await supabase
        .from("promotions")
        .select("id, name, start_date, end_date, business_id, created_at, is_active")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(20)

      if (promotionsError || !promotionsData?.length) {
        setPromotions([])
        setLoading(false)
        return
      }

      const businessIds = [...new Set(promotionsData.map((p) => p.business_id))]
      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select("id, name, owner_id")
        .in("id", businessIds)

      if (businessesError || !businessesData?.length) {
        setPromotions([])
        setLoading(false)
        return
      }

      const ownerIds = [...new Set(businessesData.map((b) => b.owner_id))]
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .in("id", ownerIds)
        .eq("subscription_tier", SUBSCRIPTION_TIER_FUNDADOR)

      if (profilesError) {
        setPromotions([])
        setLoading(false)
        return
      }

      const founderOwnerIds = new Set((profilesData || []).map((p) => p.id))
      const businessesMap = new Map(businessesData.map((b) => [b.id, b]))

      const combined: Promotion[] = promotionsData
        .filter((p) => {
          const biz = businessesMap.get(p.business_id)
          return biz && founderOwnerIds.has(biz.owner_id)
        })
        .map((promo) => ({
          id: promo.id,
          name: promo.name,
          start_date: promo.start_date,
          end_date: promo.end_date,
          business_id: promo.business_id,
          businesses: businessesMap.get(promo.business_id)
            ? { name: businessesMap.get(promo.business_id)!.name }
            : null,
        }))

      setPromotions(combined)
    } catch (err) {
      console.error("Error loading promotions:", err)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-rotate every 1s with fade
  useEffect(() => {
    if (promotions.length <= 1) return

    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % promotions.length)
        setIsTransitioning(false)
      }, 150)
    }, ROTATION_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [promotions.length])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-[120px] rounded-xl bg-white/5 animate-pulse" />
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Promociones
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">No hay promociones de Fundador activas</p>
          <p className="text-xs text-gray-500 mt-2">Solo negocios Fundador aparecen aquí.</p>
        </div>
      </div>
    )
  }

  const current = promotions[currentIndex]
  const businessName = current.businesses?.name || "Negocio"

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-white/20 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Promociones
        <span className="ml-auto text-xs font-normal px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
          {promotions.length}
        </span>
      </h3>

      {/* Single card - fixed height to avoid jump */}
      <div className="min-h-[120px] relative">
        <Link
          href={`/app/dashboard/negocios/${current.business_id}`}
          className="block"
        >
          <div
            className={`relative p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 group overflow-hidden ${
              isTransitioning ? "opacity-0 transition-opacity duration-200" : "opacity-100 transition-opacity duration-300"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />

            <div className="relative min-h-[88px] flex flex-col">
              <h4 className="font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-yellow-300 transition-colors">
                {current.name}
              </h4>
              <p className="text-xs text-yellow-300/90 font-medium mb-3 truncate">
                {businessName}
              </p>
              <div className="mt-auto flex items-center gap-1 text-yellow-400 text-xs group-hover:gap-2 transition-all">
                <span>Ver más</span>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Dots indicator when multiple */}
      {promotions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {promotions.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Promoción ${i + 1}`}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-4 bg-yellow-400" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-gray-500">
        Ofertas exclusivas Fundador
      </p>
    </div>
  )
}
