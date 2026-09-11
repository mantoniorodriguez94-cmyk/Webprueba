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
            const isCurrent = currentTier && currentTier >= t.tier

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
                  {t.tier === 0 && (
                    <>
                      <li>📍 Acceso a tu Localización en el Mapa con un click </li>
                      <li>📷 Foto de Perfil más 1 Foto en la Galería</li>
                      <li>🔍 Búsqueda Básica</li>
                      <li>🛡️ Sube tu horario de atención</li>
                      <li>📞 Publica tus promociones</li>
                    </>
                  )}
                  {t.tier === 1 && (
                    <>
                      <li className="text-[11px] text-ink-2/80">
                        ✅ <span className="italic">Todo lo del plan Básico más:</span>
                      </li>
                      <li>💬 Sistema de Chat en vivo</li>
                      <li>📲 Comunicacion Directa a WhatsApp y Llamadas con un solo botón</li>
                      <li>📷 Galería de hasta 3 Fotos</li>
                    </>
                  )}
                  {t.tier === 2 && (
                    <>
                      <li className="text-[11px] text-ink-2/80">
                        ✅ <span className="italic">Todo lo del plan Conecta más:</span>
                      </li>
                      <li>🚀 Prioridad en Resultados de búsqueda (Arriba)</li>
                      <li>🛡️ Tu negocio aparece en la seccion de &quot;Más Destacados&quot;</li>
                      <li>📷 Galería de hasta 5 Fotos</li>
                    </>
                  )}
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
            Círculo de Patrocinadores
          </h2>
          <p className="text-xs text-ink-2 leading-relaxed max-w-xl">
            ¿Quieres apoyar nuestra causa? Conviértete en{" "}
            <span className="font-semibold text-ink">Patrocinador</span>. Tu negocio
            portará la insignia de verificación oficial y destacará sobre el resto.
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
                    Tu negocio formará parte del círculo interno de apoyo a la plataforma y tendrá
                    prioridad visual frente al resto, ademas de otros beneficios.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-mono text-3xl font-extrabold text-ink">${founderTier.price}</span>
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
                  <p className="font-semibold text-ink">Badge de Verificado Oficial</p>
                  <p className="text-[11px] text-ink-2">
                    Check de verificación, igual que en redes sociales, para negocios verificados.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-ink mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Marco Distintivo Exclusivo</p>
                  <p className="text-[11px] text-ink-2">
                    Borde exclusivo alrededor de tu tarjeta de negocio en el feed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-ink mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Módulo de Promociones</p>
                  <p className="text-[11px] text-ink-2">
                    Tus promociones serán destacadas para impulsar tus ventas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Soporte VIP Prioritario</p>
                  <p className="text-[11px] text-ink-2">
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


