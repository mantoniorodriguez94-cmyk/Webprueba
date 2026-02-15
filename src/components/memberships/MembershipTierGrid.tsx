"use client"

import React from "react"
import type { MembershipTier } from "@/lib/memberships/tiers"
import {
  Crown,
  BadgeCheck,
  HeartHandshake,
  Sparkles,
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
    price: 3,
    badgeType: "bronze_shield" as const,
    highlight: false
  },
  {
    tier: 3 as MembershipTier,
    title: "Fundador",
    label: "Máximo Estatus",
    price: 5,
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
        bgClass: "bg-orange-500/10",
        textClass: "text-orange-200",
        borderClass: "border border-orange-500/40",
        Icon: MessageCircle,
        iconClass: "text-orange-300"
      }
    case 2:
      return {
        label: "Destaca",
        bgClass: "bg-slate-400/10",
        textClass: "text-slate-200",
        borderClass: "border border-slate-400/40",
        Icon: TrendingUp,
        iconClass: "text-slate-200"
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
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            Planes Comerciales
          </h2>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {businessTiers.map((t) => {
            const isCurrent = currentTier && currentTier >= t.tier

            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => {
                  // El plan Free es informativo; solo abrir modal para tiers de pago
                  if (t.tier > 0) {
                    onSelectTier(t.tier)
                  }
                }}
                className={[
                  "relative flex flex-col items-stretch rounded-3xl border p-5 text-left transition-all duration-300",
                  "bg-transparent backdrop-blur-sm",
                  "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40",
                  isCurrent
                    ? "border-emerald-400/80 shadow-lg shadow-emerald-500/30"
                    : "border-white/10 shadow-md shadow-black/30"
                ].join(" ")}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{t.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{t.label}</p>
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
                    <span className="text-3xl font-extrabold text-white">
                      ${t.price}
                    </span>
                    <span className="text-sm text-gray-400">
                      {t.tier === 0 ? "siempre" : "/mes"}
                    </span>
                  </div>
                  {isCurrent && (
                    <p className="mt-1 text-xs text-emerald-400">Ya tienes este nivel o superior</p>
                  )}
                </div>

                <ul className="mt-auto space-y-1 text-xs text-gray-300">
                  {t.tier === 0 && (
                    <>
                      <li>📍 Acceso a tu Localización en el Mapa con un click </li>
                      <li>📷 1 Foto de Perfil y Galería de Fotos</li>
                      <li>🔍 Búsqueda Básica</li>
                    </>
                  )}
                  {t.tier === 1 && (
                    <>
                      <li className="text-[11px] text-gray-400">
                        ✅ <span className="italic">Todo lo del plan Gratis</span>
                      </li>
                      <li>💬 Sistema de Chat con Activo</li>
                      <li>📲 Comunicacion Directa a WhatsApp y Llamadas con un solo click</li>
                      <li>📷 Galería de hasta 3 Fotos</li>
                    </>
                  )}
                  {t.tier === 2 && (
                    <>
                      <li className="text-[11px] text-gray-400">
                        ✅ <span className="italic">Todo lo del plan Conecta</span>
                      </li>
                      <li>🚀 Prioridad en Resultados (Arriba)</li>
                      <li>🛡️ Badge Destaca</li>
                      <li>📷 Galería de hasta 5 Fotos</li>
                    </>
                  )}
                </ul>
              </button>
            )
          })}
        </div>
      </section>

      {/* Sección B: Círculo de Fundadores */}
      {founderTier && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-300" />
            Círculo de Fundadores
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
            ¿Quieres apoyar nuestra causa? Conviértete en{" "}
            <span className="font-semibold text-yellow-300">Patrocinador Fundador</span>. Tu negocio
            portará la insignia de verificación oficial y destacará sobre el resto.
          </p>

          <button
            type="button"
            onClick={() => onSelectTier(founderTier.tier)}
            className="w-full text-left relative overflow-hidden rounded-3xl border-2 border-yellow-400/80 bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/15 backdrop-blur-xl shadow-xl shadow-yellow-500/30 p-6 md:p-7 transition-all duration-300 hover:shadow-yellow-500/50 hover:-translate-y-1"
          >
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top,_#facc15_0,_transparent_50%),radial-gradient(circle_at_bottom,_#fb923c_0,_transparent_55%)]" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-yellow-500/25 border border-yellow-300/70 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Fundador</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 text-yellow-950 text-[10px] font-semibold px-2 py-0.5 shadow-sm shadow-yellow-500/40">
                      <HeartHandshake className="w-3 h-3" />
                      Special
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-yellow-100/90 max-w-md">
                    Tu negocio formará parte del círculo interno de apoyo a la plataforma y tendrá
                    prioridad visual frente al resto, ademas de otros beneficios.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-extrabold text-white">${founderTier.price}</span>
                  <span className="text-sm text-yellow-100">/mes</span>
                </div>
                <p className="mt-1 text-[11px] text-yellow-100">
                  Incluye insignia de verificación, borde dorado y promociones destacadas.
                </p>
                <p className="mt-1 text-[11px] text-yellow-200 font-medium">
                  Hasta 2 negocios incluidos.
                </p>
              </div>
            </div>

            <div className="relative mt-4 grid gap-3 md:grid-cols-2 text-xs text-yellow-50">
              <div className="flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-200 mt-0.5" />
                <div>
                  <p className="font-semibold">Badge de Verificado Oficial</p>
                  <p className="text-[11px] text-yellow-100/90">
                    Check azul/dorado similar a Instagram/Facebook para negocios verificados.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-yellow-200 mt-0.5" />
                <div>
                  <p className="font-semibold">Borde Dorado Exclusivo</p>
                  <p className="text-[11px] text-yellow-100/90">
                    Marco dorado exclusivo alrededor de tu tarjeta de negocio.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-100 mt-0.5" />
                <div>
                  <p className="font-semibold">Módulo de Promociones</p>
                  <p className="text-[11px] text-yellow-100/90">
                    Tus promociones serán destacadas para impulsar tus ventas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-200 mt-0.5" />
                <div>
                  <p className="font-semibold">Soporte VIP Prioritario</p>
                  <p className="text-[11px] text-yellow-100/90">
                    Canal de soporte preferente para resolver tus dudas más rápido.
                  </p>
                </div>
              </div>
            </div>
          </button>
        </section>
      )}
    </>
  )
}

export default MembershipTierGrid


