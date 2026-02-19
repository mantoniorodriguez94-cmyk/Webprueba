"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Crown } from "lucide-react"
import { SUBSCRIPTION_TIER_FUNDADOR } from "@/lib/memberships/tiers"

export interface SpotlightPromotion {
  id: string
  name: string
  price: number | null
  start_date: string
  end_date: string
  business_id: string
  business_name: string
}

export default function PromotionsSpotlight() {
  const [promotions, setPromotions] = useState<SpotlightPromotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFounderPromotions = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]

        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("id, name, price, start_date, end_date, business_id")
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

        const founderPromos: SpotlightPromotion[] = promotionsData
          .filter((p) => {
            const biz = businessesMap.get(p.business_id)
            return biz && founderOwnerIds.has(biz.owner_id)
          })
          .map((p) => {
            const biz = businessesMap.get(p.business_id)!
            return {
              id: p.id,
              name: p.name,
              price: p.price,
              start_date: p.start_date,
              end_date: p.end_date,
              business_id: p.business_id,
              business_name: biz.name,
            }
          })

        setPromotions(founderPromos)
      } catch (err) {
        console.error("[PromotionsSpotlight] Error:", err)
        setPromotions([])
      } finally {
        setLoading(false)
      }
    }

    loadFounderPromotions()
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg animate-pulse" />
          <div className="h-6 w-56 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 h-36 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (promotions.length === 0) return null

  return (
    <section className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/30 p-6 shadow-xl shadow-yellow-500/10">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
          <Crown className="w-5 h-5 text-yellow-400" />
        </span>
        Promociones Exclusivas en Grand Prairie
      </h2>
      <p className="text-sm text-yellow-200/90 mb-4">
        Ofertas de negocios Fundador — visibilidad prioritaria en la plataforma
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-1">
        {promotions.map((promo) => (
          <Link
            key={promo.id}
            href={`/app/dashboard/negocios/${promo.business_id}`}
            className="flex-shrink-0 w-72 group"
          >
            <div className="h-full rounded-2xl border-2 border-yellow-500/40 bg-white/5 hover:border-yellow-400/60 hover:bg-white/10 transition-all duration-300 p-5 flex flex-col">
              <span className="inline-flex items-center gap-1 self-start px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold border border-yellow-500/40 mb-3">
                <Crown className="w-3 h-3" />
                Fundador
              </span>
              <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-yellow-100">
                {promo.name}
              </h3>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {promo.business_name}
              </p>
              {promo.price != null && Number(promo.price) > 0 && (
                <p className="text-lg font-bold text-yellow-400 mt-auto">
                  ${Number(promo.price).toFixed(2)}
                </p>
              )}
              <div className="flex items-center gap-1 text-yellow-400/90 text-xs mt-2">
                <span>Ver negocio</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
