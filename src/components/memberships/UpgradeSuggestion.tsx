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

const TIER_INFO: Record<SubscriptionTier, { name: string; price: number; bgClass: string; textClass: string; borderClass: string; buttonClass: string }> = {
  0: { 
    name: "Básico", 
    price: 0, 
    bgClass: "bg-gray-500/20", 
    textClass: "text-gray-300", 
    borderClass: "border-gray-400/50",
    buttonClass: "bg-gray-500 text-gray-950 hover:bg-gray-400"
  },
  1: { 
    name: "Conecta", 
    price: 1, 
    bgClass: "bg-orange-500/20", 
    textClass: "text-orange-300", 
    borderClass: "border-orange-400/50",
    buttonClass: "bg-orange-500 text-orange-950 hover:bg-orange-400"
  },
  2: { 
    name: "Destaca", 
    price: 3, 
    bgClass: "bg-slate-400/20", 
    textClass: "text-slate-300", 
    borderClass: "border-slate-400/50",
    buttonClass: "bg-slate-400 text-slate-950 hover:bg-slate-300"
  },
  3: { 
    name: "Fundador", 
    price: 5, 
    bgClass: "bg-yellow-500/20", 
    textClass: "text-yellow-300", 
    borderClass: "border-yellow-400/50",
    buttonClass: "bg-yellow-500 text-yellow-950 hover:bg-yellow-400"
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
      <div className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}>
        <Lock className="w-3 h-3" />
        <span>
          {featureName} requiere plan <span className="font-semibold text-gray-300">{tierLabel}</span>
        </span>
      </div>
    )
  }

  if (variant === "modal") {
    return (
      <div className={`bg-gradient-to-br ${tierInfo.bgClass} rounded-2xl border ${tierInfo.borderClass} p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${tierInfo.bgClass} border ${tierInfo.borderClass} flex items-center justify-center flex-shrink-0`}>
            <Lock className={`w-5 h-5 ${tierInfo.textClass}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              {featureName} es exclusivo para {tierLabel}
            </h4>
            {featureDescription && (
              <p className="text-xs text-gray-300 mb-3">{featureDescription}</p>
            )}
            <button
              onClick={handleUpgrade}
              className={`inline-flex items-center gap-2 rounded-full ${tierInfo.buttonClass} px-4 py-2 text-xs font-semibold transition-colors shadow-lg`}
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
    <div className={`bg-transparent backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-5 shadow-lg shadow-black/40 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${tierInfo.bgClass} border ${tierInfo.borderClass} flex items-center justify-center flex-shrink-0`}>
          <Lock className={`w-5 h-5 ${tierInfo.textClass}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            ¡Potencia tu negocio!
            <span className={`inline-flex items-center gap-1 rounded-full ${tierInfo.bgClass} ${tierInfo.textClass} text-[10px] font-semibold px-2 py-0.5 border ${tierInfo.borderClass}`}>
              <Sparkles className="w-3 h-3" />
              Exclusivo {tierLabel}
            </span>
          </h4>
          <p className="text-xs text-gray-300 mb-2">
            El acceso a <span className="font-semibold text-white">{featureName}</span> es exclusivo para miembros{" "}
            <span className={`font-semibold ${tierInfo.textClass}`}>{tierLabel}</span>.
          </p>
          {featureDescription && (
            <p className="text-xs text-gray-400 mb-3">{featureDescription}</p>
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

