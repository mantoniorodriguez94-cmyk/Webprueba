"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { SUBSCRIPTION_TIER_PATROCINA, isTierActive } from "@/lib/memberships/tiers"

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyBmaWxsPSIjMTMxMzEzIiB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="

type CarouselPromotion = {
  id: string
  name: string
  price: number | null
  business_id: string
  business_name: string
  business_logo_url: string | null
  tier: number
}

const AUTO_PLAY_INTERVAL = 2000

export default function PromotionsCarousel() {
  const [items, setItems] = useState<CarouselPromotion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const loadPromotions = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data: promotionsData, error: promotionsError } = await supabase
        .from("promotions")
        .select("id, name, price, start_date, end_date, business_id, is_active")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(30)

      if (promotionsError || !promotionsData?.length) {
        setItems([])
        setLoading(false)
        return
      }

      const businessIds = [...new Set(promotionsData.map((p) => p.business_id))]

      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select("id, name, logo_url, owner_id")
        .in("id", businessIds)

      if (businessesError || !businessesData?.length) {
        setItems([])
        setLoading(false)
        return
      }

      const ownerIds = [...new Set(businessesData.map((b) => b.owner_id).filter(Boolean))]

      // El filtro por columna (.gte subscription_tier) no distingue un pago
      // vigente de uno vencido: se trae subscription_end_date y el mapa sólo
      // guarda a quienes isTierActive confirma como vigentes.
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, subscription_tier, subscription_end_date")
        .in("id", ownerIds as string[])
        .gte("subscription_tier", 2)

      if (profilesError || !profilesData?.length) {
        setItems([])
        setLoading(false)
        return
      }

      const tierByOwner = new Map<string, number>()
      for (const profile of profilesData as any[]) {
        if (isTierActive(profile.subscription_tier, profile.subscription_end_date)) {
          tierByOwner.set(profile.id, profile.subscription_tier ?? 0)
        }
      }

      const businessById = new Map(
        businessesData.map((b) => [b.id, b] as const),
      )

      const result: CarouselPromotion[] = promotionsData
        .map((promo) => {
          const biz = businessById.get(promo.business_id)
          if (!biz || !biz.owner_id) return null
          const tier = tierByOwner.get(biz.owner_id)
          if (!tier || tier < 2) return null
          return {
            id: promo.id,
            name: promo.name,
            price: promo.price,
            business_id: promo.business_id,
            business_name: biz.name,
            business_logo_url: (biz as any).logo_url ?? null,
            tier,
          }
        })
        .filter(Boolean) as CarouselPromotion[]

      setItems(result)
      setActiveIndex(0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPromotions()
  }, [loadPromotions])

  useEffect(() => {
    if (isHovered || items.length <= 1) return

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, AUTO_PLAY_INTERVAL)

    return () => window.clearInterval(id)
  }, [isHovered, items.length])

  if (loading) {
    return (
      <section className="surface rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-black/5 rounded-lg animate-pulse" />
          <div className="h-5 w-40 bg-black/5 rounded animate-pulse" />
        </div>
        <div className="h-40 bg-black/5 rounded-2xl animate-pulse" />
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="surface rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-ink mb-1">
              Impulsa tu negocio aquí
            </h2>
            <p className="text-sm text-ink-2">
              Destaca tus promociones frente a miles de clientes potenciales.
            </p>
          </div>
          <Link
            href="/app/dashboard/membresia"
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold transition-colors"
          >
            Ver Planes
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </section>
    )
  }

  const current = items[activeIndex]
  const isPatrocina = current.tier >= SUBSCRIPTION_TIER_PATROCINA

  return (
    <section
      className="surface rounded-3xl p-6 shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-ink">
            Promociones destacadas
          </h2>
          <p className="text-xs md:text-sm text-ink-2">
            Ofertas activas de negocios Conecta, Destaca y Patrocina
          </p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-6 bg-blue-500"
                  : "w-2 bg-black/10 hover:bg-black/20"
              }`}
              aria-label={`Ver promoción ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="relative h-52 sm:h-60 md:h-64">
        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`absolute inset-0 flex flex-col md:flex-row gap-4 md:gap-6 rounded-2xl border p-4 md:p-5 bg-white dark:bg-paper-2 overflow-hidden ${
              isPatrocina
                ? "border-purple-300 dark:border-purple-400/40 shadow-[0_0_28px_rgba(226,79,214,0.18)]"
                : "border-black/8 dark:border-white/10"
            }`}
          >
            <div className="relative w-full md:w-2/5 h-32 sm:h-40 md:h-full flex-shrink-0">
              {current.business_logo_url ? (
                <Image
                  src={current.business_logo_url}
                  alt={current.business_name}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover rounded-xl"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-4xl font-bold text-blue-600">
                  {current.business_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700">
                  {isPatrocina ? "Patrocina" : "Promoción activa"}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-ink line-clamp-2">
                  {current.name}
                </h3>
                <p className="text-sm text-ink-2 line-clamp-2">
                  {current.business_name}
                </p>
                {current.price != null && Number(current.price) > 0 && (
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    ${Number(current.price).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/app/dashboard/negocios/${current.business_id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-semibold transition-colors"
                >
                  Ver Negocio
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
                <p className="text-[11px] text-ink-2/70 hidden sm:block">
                  Rotando cada 2 segundos • Pausa al pasar el cursor
                </p>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  )
}

