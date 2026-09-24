"use client"

import Link from "next/link"
import { Crown, HeartHandshake, MessageCircle, TrendingUp } from "lucide-react"
import {
  SUBSCRIPTION_TIER_FREE,
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
  SUBSCRIPTION_PRICES,
  getLabelForTier,
  BENEFICIOS_POR_TIER
} from "@/lib/memberships/tiers"

interface PublicPricingTableProps {
  ctaHref: string
}

const businessTiers = [
  { tier: SUBSCRIPTION_TIER_FREE, label: "Presencia Básica" },
  { tier: SUBSCRIPTION_TIER_CONECTA, label: "Conecta con Clientes" },
  { tier: SUBSCRIPTION_TIER_DESTACADO, label: "Más Visibilidad" }
]

export default function PublicPricingTable({ ctaHref }: PublicPricingTableProps) {
  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {businessTiers.map((t) => {
          const price = SUBSCRIPTION_PRICES[t.tier]
          const badge =
            t.tier === SUBSCRIPTION_TIER_CONECTA
              ? { label: "Conecta", Icon: MessageCircle, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "text-blue-600" }
              : t.tier === SUBSCRIPTION_TIER_DESTACADO
              ? { label: "Destaca", Icon: TrendingUp, bg: "bg-black/5", text: "text-ink-2", border: "border-black/10", icon: "text-ink-2" }
              : null

          return (
            <Link
              key={t.tier}
              href={ctaHref}
              className="relative flex flex-col items-stretch rounded-3xl border p-5 text-left transition-all duration-300 bg-white dark:bg-paper-2 border-black/8 dark:border-white/10 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-400/50"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-ink">{getLabelForTier(t.tier)}</h3>
                  <p className="text-xs text-ink-2 mt-1">{t.label}</p>
                </div>
                {badge && (
                  <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                    <badge.Icon className={`w-3 h-3 ${badge.icon}`} />
                    <span>{badge.label}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-ink">${price}</span>
                  <span className="text-sm text-ink-2">{t.tier === SUBSCRIPTION_TIER_FREE ? "siempre" : "/mes"}</span>
                </div>
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
            </Link>
          )
        })}
      </div>

      {/* Tier "Patrocina" — dorado, igual que el borde de la tarjeta en el
          feed (tier-patrocina-glow) y que su insignia. Esta tarjeta se quedó
          en magenta cuando el tier volvió al oro, así que el plan se anunciaba
          en rosado y después se entregaba en dorado.
          Card blanca, no un campo de color grande: el oro vive en el icono, el
          pill y el borde. */}
      <div className="mt-8">
        <Link
          href={ctaHref}
          className="block relative overflow-hidden rounded-3xl border-2 border-amber-300 dark:border-amber-400/40 bg-white dark:bg-paper-2 shadow-sm p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">Patrocina</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5">
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
                <span className="text-3xl font-extrabold text-ink">${SUBSCRIPTION_PRICES[SUBSCRIPTION_TIER_PATROCINA]}</span>
                <span className="text-sm text-ink-2">/mes</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-2">
                El plan más completo.
              </p>
            </div>
          </div>

          <ul className="relative mt-4 grid gap-2 md:grid-cols-2 text-xs text-ink-2">
            {BENEFICIOS_POR_TIER[SUBSCRIPTION_TIER_PATROCINA].items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Link>
      </div>

      <div className="text-center mt-10">
        <Link href={ctaHref} className="inline-block w-full sm:w-auto">
          <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25">
            Registrar mi negocio gratis
          </button>
        </Link>
        <p className="text-sm text-ink-2 text-center mt-3">
          Cancela cuando quieras. Sin permanencia, sin contratos, sin letra pequeña.
        </p>
      </div>
    </>
  )
}
