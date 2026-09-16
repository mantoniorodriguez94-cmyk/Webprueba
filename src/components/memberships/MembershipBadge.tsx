"use client"

import type { BadgeType } from "@/lib/memberships/tiers"
import { Crown, CheckCircle } from "lucide-react"
import React from "react"

/**
 * La corona de cada plan pago, en un solo sitio.
 *
 * Los tres planes comparten la corona y se distinguen por el metal: bronce,
 * plata y oro. Es una escalera que se lee de un vistazo, sin tener que saber
 * qué significa un cohete o un rayo — que es lo que había antes.
 *
 * Vive acá y no repetido en cada componente porque ya pasó: el badge de
 * Patrocina se quedó en magenta cuando la tarjeta del feed volvió al dorado,
 * y el plan se anunciaba de un color y se entregaba de otro.
 */
export const CORONA_POR_TIER: Record<
  number,
  { solido: string; suave: string; etiqueta: string }
> = {
  1: {
    solido: "bg-amber-700",
    suave: "bg-amber-50 text-amber-800 border border-amber-300",
    etiqueta: "Conecta",
  },
  2: {
    solido: "bg-slate-400",
    suave: "bg-slate-100 text-slate-700 border border-slate-300",
    etiqueta: "Destaca",
  },
  3: {
    solido: "bg-amber-500",
    suave: "bg-amber-50 text-amber-700 border border-amber-300",
    etiqueta: "Patrocina",
  },
}

interface MembershipBadgeProps {
  type: BadgeType
  className?: string
}

export function MembershipBadge({ type, className = "" }: MembershipBadgeProps) {
  const baseClasses =
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"

  // Tier 0 – Básico
  if (!type || type === "none") {
    return (
      <span
        className={`${baseClasses} border border-sky-200 text-sky-700 bg-sky-50 ${className}`}
      >
        <span>Básico</span>
      </span>
    )
  }

  // Los tres planes pagos: la misma corona, distinto metal.
  const tier =
    type === "member" ? 1
    : type === "bronze_shield" || type === "silver_star" ? 2
    : type === "gold_crown" ? 3
    : 0

  const corona = CORONA_POR_TIER[tier]
  if (corona) {
    return (
      <span className={`${baseClasses} ${corona.suave} ${className}`}>
        <Crown className="w-3 h-3" />
        <span className={tier === 3 ? "font-bold" : undefined}>{corona.etiqueta}</span>
      </span>
    )
  }

  // Fallback genérico (por si se agrega un nuevo tipo en el futuro)
  return (
    <span
      className={`${baseClasses} bg-green-50 text-green-700 border border-green-200 ${className}`}
    >
      <CheckCircle className="w-3 h-3" />
      <span>Membresía</span>
    </span>
  )
}

export default MembershipBadge

