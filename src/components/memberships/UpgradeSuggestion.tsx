// src/components/memberships/UpgradeSuggestion.tsx
"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { Lock, Sparkles, ArrowRight } from "lucide-react"
import type { SubscriptionTier } from "@/lib/memberships/tiers"
import { getLabelForTier, getPriceForTier } from "@/lib/memberships/tiers"

interface UpgradeSuggestionProps {
  requiredTier: SubscriptionTier
  featureName: string
  featureDescription?: string
  className?: string
  variant?: "card" | "inline" | "modal"
}

// Mismo criterio de color por tier que MembershipBadge: básico neutro,
// Conecta en el acento único, Destaca en plata, Patrocina en magenta
// (nunca dorado — ese rol lo cerró el magenta en todo el rediseño).
const TIER_INFO: Record<SubscriptionTier, { name: string; price: number; bgClass: string; textClass: string; borderClass: string; buttonClass: string }> = {
  0: {
    name: "Básico",
    price: 0,
    bgClass: "bg-black/5",
    textClass: "text-ink-2",
    borderClass: "border-black/10",
    buttonClass: "bg-ink hover:bg-ink/90 dark:bg-white/10 dark:hover:bg-white/15 dark:border dark:border-white/15 text-white"
  },
  1: {
    name: "Conecta",
    price: 1,
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
    buttonClass: "bg-blue-500 text-white hover:bg-blue-600"
  },
  2: {
    name: "Destaca",
    price: 3,
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-300",
    buttonClass: "bg-slate-600 text-white hover:bg-slate-700"
  },
  3: {
    name: "Patrocina",
    price: 5,
    // Dorado, como el resto de la identidad de Patrocina.
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    buttonClass: "bg-amber-600 text-white hover:bg-amber-700"
  }
}

export default function UpgradeSuggestion({
  requiredTier,
  featureName,
  featureDescription,
  className = "",
  variant = "card"
}: UpgradeSuggestionProps) {
  const router = useRouter()
  const tierInfo = TIER_INFO[requiredTier]
  const tierLabel = getLabelForTier(requiredTier)
  const tierPrice = getPriceForTier(requiredTier)

  const handleUpgrade = () => {
    router.push("/app/dashboard/membresia")
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 text-xs text-ink-2 ${className}`}>
        <Lock className="w-3 h-3" />
        <span>
          {featureName} requiere plan <span className="font-semibold text-ink">{tierLabel}</span>
        </span>
      </div>
    )
  }

  if (variant === "modal") {
    return (
      <div className={`${tierInfo.bgClass} rounded-2xl border ${tierInfo.borderClass} p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white border ${tierInfo.borderClass} flex items-center justify-center flex-shrink-0`}>
            <Lock className={`w-5 h-5 ${tierInfo.textClass}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-ink mb-1">
              {featureName} es exclusivo para {tierLabel}
            </h4>
            {featureDescription && (
              <p className="text-xs text-ink-2 mb-3">{featureDescription}</p>
            )}
            <button
              onClick={handleUpgrade}
              className={`inline-flex items-center gap-2 rounded-full ${tierInfo.buttonClass} px-4 py-2 text-xs font-semibold transition-colors shadow-sm`}
            >
              <Sparkles className="w-3 h-3" />
              Actualizar a {tierLabel} (${tierPrice}/mes)
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default: card variant
  return (
    <div className={`surface rounded-2xl p-4 md:p-5 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${tierInfo.bgClass} border ${tierInfo.borderClass} flex items-center justify-center flex-shrink-0`}>
          <Lock className={`w-5 h-5 ${tierInfo.textClass}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
            ¡Potencia tu negocio!
            <span className={`inline-flex items-center gap-1 rounded-full ${tierInfo.bgClass} ${tierInfo.textClass} text-[10px] font-semibold px-2 py-0.5 border ${tierInfo.borderClass}`}>
              <Sparkles className="w-3 h-3" />
              Exclusivo {tierLabel}
            </span>
          </h4>
          <p className="text-xs text-ink-2 mb-2">
            El acceso a <span className="font-semibold text-ink">{featureName}</span> es exclusivo para miembros{" "}
            <span className={`font-semibold ${tierInfo.textClass}`}>{tierLabel}</span>.
          </p>
          {featureDescription && (
            <p className="text-xs text-ink-2/80 mb-3">{featureDescription}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className={`inline-flex items-center gap-2 rounded-full ${tierInfo.buttonClass} px-4 py-2 text-xs font-semibold transition-colors shadow-lg`}
            >
              <Sparkles className="w-3 h-3" />
              Únete por solo ${tierPrice}/mes
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

