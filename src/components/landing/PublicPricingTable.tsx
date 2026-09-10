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
              ? { label: "Conecta", Icon: MessageCircle, bg: "bg-orange-500/10", text: "text-orange-200", border: "border-orange-500/40", icon: "text-orange-300" }
              : t.tier === SUBSCRIPTION_TIER_DESTACADO
              ? { label: "Destaca", Icon: TrendingUp, bg: "bg-slate-400/10", text: "text-slate-200", border: "border-slate-400/40", icon: "text-slate-200" }
              : null

          return (
            <Link
              key={t.tier}
              href={ctaHref}
              className="relative flex flex-col items-stretch rounded-3xl border p-5 text-left transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 shadow-md shadow-black/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 hover:border-blue-400/50"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{getLabelForTier(t.tier)}</h3>
                  <p className="text-xs text-gray-400 mt-1">{t.label}</p>
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
                  <span className="text-3xl font-extrabold text-white">${price}</span>
                  <span className="text-sm text-gray-400">{t.tier === SUBSCRIPTION_TIER_FREE ? "siempre" : "/mes"}</span>
                </div>
              </div>

              <ul className="mt-auto space-y-1 text-xs text-gray-300">
                {t.tier === SUBSCRIPTION_TIER_FREE && (
                  <>
                    <li>📍 Acceso a tu Localización en el Mapa con un click</li>
                    <li>📷 Foto de Perfil más 1 Foto en la Galería</li>
                    <li>🔍 Búsqueda Básica</li>
                    <li>🛡️ Sube tu horario de atención</li>
                    <li>📞 Publica tus promociones</li>
                  </>
                )}
                {t.tier === SUBSCRIPTION_TIER_CONECTA && (
                  <>
                    <li className="text-[11px] text-gray-400">✅ <span className="italic">Todo lo del plan Básico más:</span></li>
                    <li>💬 Sistema de Chat en vivo</li>
                    <li>📲 Comunicación Directa a WhatsApp y Llamadas con un solo botón</li>
                    <li>📷 Galería de hasta 3 Fotos</li>
                  </>
                )}
                {t.tier === SUBSCRIPTION_TIER_DESTACADO && (
                  <>
                    <li className="text-[11px] text-gray-400">✅ <span className="italic">Todo lo del plan Conecta más:</span></li>
                    <li>🚀 Prioridad en Resultados de búsqueda (Arriba)</li>
                    <li>🛡️ Tu negocio aparece en la sección de &quot;Más Destacados&quot;</li>
                    <li>📷 Galería de hasta 5 Fotos</li>
                  </>
                )}
              </ul>
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          href={ctaHref}
          className="block relative overflow-hidden rounded-3xl border-2 border-yellow-400/80 bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/15 backdrop-blur-xl shadow-xl shadow-yellow-500/30 p-6 md:p-7 transition-all duration-300 hover:shadow-yellow-500/50 hover:-translate-y-1"
        >
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top,_#facc15_0,_transparent_50%),radial-gradient(circle_at_bottom,_#fb923c_0,_transparent_55%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500/25 border border-yellow-300/70 flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Patrocina</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 text-yellow-950 text-[10px] font-semibold px-2 py-0.5 shadow-sm shadow-yellow-500/40">
                    <HeartHandshake className="w-3 h-3" />
                    Special
                  </span>
                </div>
                <p className="mt-1 text-xs text-yellow-100/90 max-w-md">
                  Tu negocio formará parte del círculo interno de apoyo a la plataforma y tendrá
                  prioridad visual frente al resto, además de otros beneficios.
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-extrabold text-white">${SUBSCRIPTION_PRICES[SUBSCRIPTION_TIER_PATROCINA]}</span>
                <span className="text-sm text-yellow-100">/mes</span>
              </div>
              <p className="mt-1 text-[11px] text-yellow-100">
                Incluye insignia de verificación, borde dorado y promociones destacadas.
              </p>
            </div>
          </div>

          <div className="relative mt-4 grid gap-3 md:grid-cols-2 text-xs text-yellow-50">
            <div className="flex items-start gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-200 mt-0.5" />
              <div>
                <p className="font-semibold">Badge de Verificado Oficial</p>
                <p className="text-[11px] text-yellow-100/90">Check azul/dorado similar a Instagram/Facebook para negocios verificados.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="w-4 h-4 text-yellow-200 mt-0.5" />
              <div>
                <p className="font-semibold">Borde Dorado Exclusivo</p>
                <p className="text-[11px] text-yellow-100/90">Marco dorado exclusivo alrededor de tu tarjeta de negocio.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-yellow-100 mt-0.5" />
              <div>
                <p className="font-semibold">Módulo de Promociones</p>
                <p className="text-[11px] text-yellow-100/90">Tus promociones serán destacadas para impulsar tus ventas.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-200 mt-0.5" />
              <div>
                <p className="font-semibold">Soporte VIP Prioritario</p>
                <p className="text-[11px] text-yellow-100/90">Canal de soporte preferente para resolver tus dudas más rápido.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="text-center mt-10">
        <Link href={ctaHref} className="inline-block w-full sm:w-auto">
          <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50">
            Registrar mi negocio gratis
          </button>
        </Link>
        <p className="text-sm text-gray-400 text-center mt-3">
          Cancela cuando quieras. Sin permanencia, sin contratos, sin letra pequeña.
        </p>
      </div>
    </>
  )
}
