"use client"

import React from "react"
import type { MembershipTier } from "@/lib/memberships/tiers"
import { BENEFICIOS_POR_TIER } from "@/lib/memberships/tiers"
import {
  Crown,
  HeartHandshake,
  MessageCircle,
  TrendingUp
} from "lucide-react"

interface MembershipTierGridProps {
  currentTier?: number | null
  onSelectTier: (tier: MembershipTier) => void
}

const tiers = [
  {
    tier: 0 as MembershipTier,
    title: "Básico",
    label: "Presencia Básica",
    price: 0,
    badgeType: "none" as const,
    highlight: false
  },
  {
    tier: 1 as MembershipTier,
    title: "Conecta",
    label: "Conecta con Clientes",
    price: 1,
    badgeType: "member" as const,
    highlight: false
  },
  {
    tier: 2 as MembershipTier,
    title: "Destaca",
    label: "Más Visibilidad",
    price: 2,
    badgeType: "bronze_shield" as const,
    highlight: false
  },
  {
    tier: 3 as MembershipTier,
    title: "Patrocina",
    label: "Máximo Estatus",
    price: 3,
    badgeType: "gold_crown" as const,
    highlight: true
  }
]

type TierBadgeVisual = {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconClass: string
}

function getTierBadgeVisual(tier: MembershipTier): TierBadgeVisual | null {
  switch (tier) {
    case 1:
      return {
        label: "Conecta",
        bgClass: "bg-blue-50",
        textClass: "text-blue-700",
        borderClass: "border border-blue-200",
        Icon: MessageCircle,
        iconClass: "text-blue-600"
      }
    case 2:
      return {
        label: "Destaca",
        bgClass: "bg-slate-100",
        textClass: "text-slate-700",
        borderClass: "border border-slate-300",
        Icon: TrendingUp,
        iconClass: "text-slate-600"
      }
    default:
      return null
  }
}

export function MembershipTierGrid({ currentTier, onSelectTier }: MembershipTierGridProps) {
  const businessTiers = tiers.filter((t) => t.tier !== 3)
  const founderTier = tiers.find((t) => t.tier === 3)

  return (
    <>
      {/* Sección A: Planes Comerciales */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide">
            Planes Comerciales
          </h2>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {businessTiers.map((t) => {
            // `currentTier && …` devuelve el NÚMERO 0 cuando no hay plan, y React
            // imprime ese 0 en pantalla. Comparar explícitamente da un booleano.
            const isCurrent = (currentTier ?? 0) > 0 && (currentTier ?? 0) >= t.tier

            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => {
                  // El plan Básico es informativo; solo abrir modal para tiers de pago
                  if (t.tier > 0) {
                    onSelectTier(t.tier)
                  }
                }}
                className={[
                  "relative flex flex-col items-stretch rounded-3xl border p-5 text-left transition-all duration-300",
                  "bg-white",
                  "hover:-translate-y-1 hover:shadow-lg",
                  isCurrent
                    ? "border-green-300 shadow-md"
                    : "border-black/8 shadow-sm"
                ].join(" ")}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{t.title}</h3>
                    <p className="text-xs text-ink-2 mt-1">{t.label}</p>
                  </div>
                  {(() => {
                    const visual = getTierBadgeVisual(t.tier)
                    if (!visual) return null
                    const { Icon } = visual
                    return (
                      <div
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          visual.bgClass,
                          visual.textClass,
                          visual.borderClass
                        ].join(" ")}
                      >
                        <Icon className={`w-3 h-3 ${visual.iconClass}`} />
                        <span>{visual.label}</span>
                      </div>
                    )
                  })()}
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-extrabold text-ink">
                      ${t.price}
                    </span>
                    <span className="text-sm text-ink-2">
                      {t.tier === 0 ? "siempre" : "/mes"}
                    </span>
                  </div>
                  {isCurrent && (
                    <p className="mt-1 text-xs text-green-600">Ya tienes este nivel o superior</p>
                  )}
                </div>

                <ul className="mt-auto space-y-1 text-xs text-ink-2">
                  {BENEFICIOS_POR_TIER[t.tier]?.incluye && (
                    <li className="text-[11px] text-ink-2/80">
                      ✅ <span className="italic">Todo lo del plan {BENEFICIOS_POR_TIER[t.tier].incluye} más:</span>
                    </li>
                  )}
                  {BENEFICIOS_POR_TIER[t.tier]?.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </section>

      {/* Sección B: Círculo de Patrocinadores
          Dorado: el cliente probó grafito y prefirió el oro, que es la
          convención que la gente ya sabe leer para el nivel más alto. Sigue
          sin ser color de marca: la app es violeta, y el oro vive confinado
          a este nivel. */}
      {founderTier && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide flex items-center gap-2">
            <Crown className="w-4 h-4 text-ink" />
            El plan más completo
          </h2>
          <p className="text-xs text-ink-2 leading-relaxed max-w-xl">
            Tu negocio llevará la corona dorada y destacará sobre el resto.
          </p>

          <button
            type="button"
            onClick={() => onSelectTier(founderTier.tier)}
            className="w-full text-left relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-white shadow-sm p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-ink" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">Patrocina</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5">
                      <HeartHandshake className="w-3 h-3" />
                      Special
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-2 max-w-md">
                    Todo lo del plan Destaca, y tus promociones salen en la sección
                    Promociones del inicio, donde las ve todo el mundo.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-mono text-3xl font-extrabold text-ink">${founderTier.price}</span>
                  <span className="text-sm text-ink-2">/mes</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-2">
                  El plan más completo.
                </p>
              </div>
            </div>

            <ul className="relative mt-4 grid gap-2 md:grid-cols-2 text-xs text-ink-2">
              {BENEFICIOS_POR_TIER[founderTier.tier]?.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </button>
        </section>
      )}
    </>
  )
}

export default MembershipTierGrid


