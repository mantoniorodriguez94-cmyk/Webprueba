"use client"

import Link from "next/link"
import { Crown, BadgeCheck, HeartHandshake, Sparkles, MessageCircle, TrendingUp } from "lucide-react"
import {
  SUBSCRIPTION_TIER_FREE,
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
  SUBSCRIPTION_PRICES,
  getLabelForTier
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
              className="relative flex flex-col items-stretch rounded-3xl border p-5 text-left transition-all duration-300 bg-white border-black/8 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-blue-300"
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
                {t.tier === SUBSCRIPTION_TIER_FREE && (
                  <>
                    <li>📍 Acceso a tu Localización en el Mapa con un click</li>
                    <li>📷 Galería de hasta 6 fotos</li>
                    <li>🔍 Búsqueda Básica</li>
                    <li>🛡️ Sube tu horario de atención</li>
                    <li>📞 Publica tus promociones</li>
                  </>
                )}
                {t.tier === SUBSCRIPTION_TIER_CONECTA && (
                  <>
                    <li className="text-[11px] text-ink-2/80">✅ <span className="italic">Todo lo del plan Básico más:</span></li>
                    <li>💬 Sistema de Chat en vivo</li>
                    <li>📲 Comunicación Directa a WhatsApp y Llamadas con un solo botón</li>
                    <li>📷 Galería de hasta 12 fotos</li>
                  </>
                )}
                {t.tier === SUBSCRIPTION_TIER_DESTACADO && (
                  <>
                    <li className="text-[11px] text-ink-2/80">✅ <span className="italic">Todo lo del plan Conecta más:</span></li>
                    <li>🚀 Prioridad en Resultados de búsqueda (Arriba)</li>
                    <li>🛡️ Tu negocio aparece en la sección de &quot;Más Destacados&quot;</li>
                    <li>📷 Galería de hasta 20 fotos</li>
                  </>
                )}
              </ul>
            </Link>
          )
        })}
      </div>

      {/* Tier "Patrocina" — la única tarjeta con magenta, la puntuación de
          marca reservada para este tier tope. Card blanca, no un campo de
          color grande: el magenta vive en el icono, el pill y el borde. */}
      <div className="mt-8">
        <Link
          href={ctaHref}
          className="block relative overflow-hidden rounded-3xl border-2 border-purple-300 bg-white shadow-sm p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">Patrocina</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500 text-white text-[10px] font-semibold px-2 py-0.5">
                    <HeartHandshake className="w-3 h-3" />
                    Special
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-2 max-w-md">
                  Tu negocio formará parte del círculo interno de apoyo a la plataforma y tendrá
                  prioridad visual frente al resto, además de otros beneficios.
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-extrabold text-ink">${SUBSCRIPTION_PRICES[SUBSCRIPTION_TIER_PATROCINA]}</span>
                <span className="text-sm text-ink-2">/mes</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-2">
                Incluye insignia de verificación, marco distintivo y promociones destacadas.
              </p>
            </div>
          </div>

          <div className="relative mt-4 grid gap-3 md:grid-cols-2 text-xs text-ink-2">
            <div className="flex items-start gap-2">
              <BadgeCheck className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Insignia de Patrocinador</p>
                <p className="text-[11px] text-ink-2">Distintivo visible en tu tarjeta que muestra que apoyas la plataforma.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="w-4 h-4 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Marco Distintivo Exclusivo</p>
                <p className="text-[11px] text-ink-2">Borde exclusivo alrededor de tu tarjeta de negocio en el feed.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Módulo de Promociones</p>
                <p className="text-[11px] text-ink-2">Tus promociones serán destacadas para impulsar tus ventas.</p>
              </div>
            </div>
          </div>
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
