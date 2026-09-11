"use client"

import type { BadgeType } from "@/lib/memberships/tiers"
import { Shield, Star, Crown, Zap, Rocket, CheckCircle } from "lucide-react"
import React from "react"

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

  // Tier 1 – Conecta
  if (type === "member") {
    return (
      <span
        className={`${baseClasses} bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
      >
        <Zap className="w-3 h-3" />
        <span>Conecta</span>
      </span>
    )
  }

  // Tier 2 – Destaca — mismo tema plata que tier-silver-glow en las
  // tarjetas de negocio (BusinessFeedCard), consistente en toda la app.
  if (type === "bronze_shield" || type === "silver_star") {
    return (
      <span
        className={`${baseClasses} bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
      >
        <Rocket className="w-3 h-3" />
        <span>Destaca</span>
      </span>
    )
  }

  // Tier 3 – Patrocina — antes dorado con glow; el magenta es ahora la
  // puntuación de marca reservada para este tier (mismo criterio que
  // tier-patrocina-glow en BusinessFeedCard).
  if (type === "gold_crown") {
    return (
      <span
        className={`${baseClasses} bg-purple-50 text-purple-700 border border-purple-300 ${className}`}
      >
        <Crown className="w-3 h-3" />
        <span className="font-bold">Patrocina</span>
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

