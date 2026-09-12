"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Crown } from "lucide-react"
import { SUBSCRIPTION_TIER_PATROCINA, isTierActive } from "@/lib/memberships/tiers"

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
        // El filtro por columna (.eq subscription_tier) no distingue un pago
        // vigente de uno vencido hace meses — se trae también
        // subscription_end_date y se filtra con isTierActive, la misma
        // comprobación que usa el resto de la app.
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, subscription_tier, subscription_end_date")
          .in("id", ownerIds)
          .eq("subscription_tier", SUBSCRIPTION_TIER_PATROCINA)

        if (profilesError) {
          setPromotions([])
          setLoading(false)
          return
        }

        const founderOwnerIds = new Set(
          (profilesData || [])
            .filter((p: any) => isTierActive(p.subscription_tier, p.subscription_end_date))
            .map((p) => p.id)
        )
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

  // No se muestra nada mientras carga. El caso habitual es que no haya
  // ninguna promoción de patrocinador, y un esqueleto grande que aparece para
  // después desaparecer es peor que no mostrar nada.
  if (loading || promotions.length === 0) return null

  return (
    <section className="rounded-3xl border border-amber-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
          <Crown className="h-5 w-5 text-amber-500" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink leading-tight">
            Promociones destacadas
          </h2>
          <p className="text-sm text-ink-2">
            Ofertas de negocios que patrocinan la plataforma
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {promotions.map((promo) => (
          <Link
            key={promo.id}
            href={`/app/dashboard/negocios/${promo.business_id}`}
            className="group w-64 flex-shrink-0"
          >
            <div className="flex h-full flex-col rounded-2xl border border-amber-200 bg-amber-50/40 p-4 transition-colors hover:border-amber-400 hover:bg-amber-50">
              <span className="mb-2 inline-flex items-center gap-1 self-start rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                <Crown className="h-3 w-3" />
                Patrocinador
              </span>
              <h3 className="font-display text-base font-bold text-ink line-clamp-2 leading-snug">
                {promo.name}
              </h3>
              <p className="mt-1 text-sm text-ink-2 line-clamp-1">{promo.business_name}</p>
              {promo.price != null && Number(promo.price) > 0 && (
                <p className="mt-auto pt-3 font-mono text-lg font-bold tabular-nums text-ink">
                  ${Number(promo.price).toFixed(2)}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Ver negocio
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
