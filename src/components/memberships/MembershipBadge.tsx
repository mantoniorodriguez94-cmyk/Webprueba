"use client"

import type { BadgeType } from "@/lib/memberships/tiers"
import { Shield, Star, Crown, User, CheckCircle } from "lucide-react"
import React from "react"

interface MembershipBadgeProps {
  type: BadgeType
  className?: string
}

export function MembershipBadge({ type, className = "" }: MembershipBadgeProps) {
  if (!type || type === "none") return null

  const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"

  if (type === "member") {
    return (
      <span
        className={`${baseClasses} bg-orange-500/10 text-orange-300 border border-orange-500/40 ${className}`}
      >
        <User className="w-3 h-3" />
        <span>Conecta</span>
      </span>
    )
  }

  if (type === "bronze_shield") {
    return (
      <span
        className={`${baseClasses} bg-gradient-to-r from-slate-500/70 to-slate-300/70 text-slate-200 border border-slate-400/60 shadow-sm shadow-slate-500/40 ${className}`}
      >
        <Shield className="w-3 h-3" />
        <span>Destaca</span>
      </span>
    )
  }

  if (type === "silver_star") {
    return (
      <span
        className={`${baseClasses} bg-gradient-to-r from-slate-500/70 to-slate-300/70 text-slate-200 border border-slate-400/60 shadow-sm shadow-slate-500/40 ${className}`}
      >
        <Star className="w-3 h-3 fill-slate-200" />
        <span>Destaca</span>
      </span>
    )
  }

  if (type === "gold_crown") {
    return (
      <span
        className={`${baseClasses} bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-yellow-950 border border-yellow-300/80 shadow-lg shadow-yellow-500/60 animate-pulse ${className}`}
      >
        <Crown className="w-3 h-3 fill-yellow-950" />
        <span>Fundador</span>
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


