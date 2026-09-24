"use client"

import React, { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Crown, ChevronLeft, ChevronRight } from "lucide-react"
import { SUBSCRIPTION_TIER_PATROCINA, isTierActive } from "@/lib/memberships/tiers"
import { perkVigente } from "@/lib/memberships/perks"

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
  const [indice, setIndice] = useState(0)
  const pistaRef = useRef<HTMLDivElement>(null)

  /* El álbum se mueve con scroll nativo y scroll-snap, no con transform: así
     el deslizamiento con el dedo en el teléfono sale gratis y con la inercia
     que el sistema operativo ya sabe hacer. Las flechas no son otro mecanismo,
     sólo empujan ese mismo scroll.

     scrollTo sobre el contenedor y no scrollIntoView sobre la tarjeta, porque
     scrollIntoView arrastra también el scroll vertical de la página y da el
     salto de que la vista se mueva sola al pulsar una flecha. */
  const irA = (destino: number) => {
    const pista = pistaRef.current
    if (!pista) return
    const total = promotions.length
    const objetivo = ((destino % total) + total) % total
    pista.scrollTo({ left: objetivo * pista.clientWidth, behavior: "smooth" })
  }

  const alDesplazar = () => {
    const pista = pistaRef.current
    if (!pista || pista.clientWidth === 0) return
    setIndice(Math.round(pista.scrollLeft / pista.clientWidth))
  }

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
          .select("id, name, owner_id, perk_promociones_hasta")
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

        // Entra en la vitrina quien tiene Patrocina vigente, o quien recibió
        // el módulo suelto desde el panel mientras la concesión no caduque.
        const founderPromos: SpotlightPromotion[] = promotionsData
          .filter((p) => {
            const biz = businessesMap.get(p.business_id)
            if (!biz) return false
            return (
              founderOwnerIds.has(biz.owner_id) ||
              perkVigente((biz as { perk_promociones_hasta?: string | null }).perk_promociones_hasta)
            )
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

  /* El encabezado se reparte entre el estado vacío y el normal, para que no
     haya dos copias del mismo título que puedan divergir. */
  const encabezado = (
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
  )

  // Mientras carga no se pinta nada: la pestaña ya muestra su propio esqueleto
  // al traer el componente, y encadenar un segundo esqueleto parpadea.
  if (loading) return null

  /* Sin promociones hay que decirlo. Cuando esto vivía incrustado en medio del
     feed, devolver null era lo correcto: nadie había pedido ver promociones y
     un cartel de "no hay" sólo ocupaba sitio. Ahora es el destino de una
     pestaña, así que null deja una pantalla en blanco a quien sí las pidió. */
  if (promotions.length === 0) {
    return (
      <section className="rounded-3xl border border-amber-300 dark:border-amber-400/40 bg-white dark:bg-paper-2 p-5 shadow-sm">
        {encabezado}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-ink-2/50" />
          </div>
          <p className="text-sm font-medium text-ink">
            No hay promociones activas
          </p>
          <p className="mt-1 text-sm text-ink-2">
            Cuando un negocio patrocinador publique una oferta, aparecerá acá.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-amber-300 dark:border-amber-400/40 bg-white dark:bg-paper-2 p-5 shadow-sm">
      {encabezado}

      <div
        ref={pistaRef}
        onScroll={alDesplazar}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
      >
        {promotions.map((promo) => (
          <Link
            key={promo.id}
            href={`/app/dashboard/negocios/${promo.business_id}`}
            className="group w-full flex-shrink-0 snap-center px-0.5"
          >
            <div className="flex h-full min-h-[11rem] flex-col rounded-2xl border border-amber-200 dark:border-amber-400/25 bg-amber-50/40 dark:bg-amber-400/10 p-4 transition-colors hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/15">
              <span
                className="mb-2 flex h-5 w-5 flex-shrink-0 items-center justify-center self-start rounded-full bg-amber-500 text-white"
                title="Patrocinador"
                aria-label="Patrocinador"
              >
                <Crown className="h-3 w-3" />
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

      {/* Con una sola promoción los controles sobran y sugerirían que hay más. */}
      {promotions.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label="Promoción anterior"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 dark:border-amber-400/30 bg-white dark:bg-paper-2 text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-50 dark:hover:bg-amber-400/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {promotions.map((promo, i) => (
              <button
                key={promo.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir a la promoción ${i + 1} de ${promotions.length}`}
                aria-current={i === indice}
                className={`h-2 rounded-full transition-all ${
                  i === indice ? "w-5 bg-amber-500" : "w-2 bg-amber-200 hover:bg-amber-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label="Promoción siguiente"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 dark:border-amber-400/30 bg-white dark:bg-paper-2 text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-50 dark:hover:bg-amber-400/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  )
}
