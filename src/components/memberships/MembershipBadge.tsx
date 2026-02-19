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
        className={`${baseClasses} border border-sky-500/40 text-sky-200 bg-sky-500/10 ${className}`}
      >
        <span>Básico</span>
      </span>
    )
  }

  // Tier 1 – Conecta
  if (type === "member") {
    return (
      <span
        className={`${baseClasses} bg-blue-500/15 text-blue-200 border border-blue-400/60 shadow-sm shadow-blue-500/30 ${className}`}
      >
        <Zap className="w-3 h-3" />
        <span>Conecta</span>
      </span>
    )
  }

  // Tier 2 – Destaca
  if (type === "bronze_shield" || type === "silver_star") {
    return (
      <span
        className={`${baseClasses} bg-gradient-to-r from-slate-600/70 via-purple-600/70 to-slate-300/70 text-slate-50 border border-slate-300/70 shadow-sm shadow-purple-500/40 ${className}`}
      >
        <Rocket className="w-3 h-3" />
        <span>Destaca</span>
      </span>
    )
  }

  // Tier 3 – Fundador
  if (type === "gold_crown") {
    return (
      <span
        className={`${baseClasses} bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 text-yellow-950 border border-yellow-300/90 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse ${className}`}
      >
        <Crown className="w-3 h-3" />
        <span className="font-bold">Fundador</span>
      </span>
    )
  }

  // Fallback genérico (por si se agrega un nuevo tipo en el futuro)
  return (
    <span
      className={`${baseClasses} bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 ${className}`}
    >
      <CheckCircle className="w-3 h-3" />
      <span>Membresía</span>
    </span>
  )
}

export default MembershipBadge

