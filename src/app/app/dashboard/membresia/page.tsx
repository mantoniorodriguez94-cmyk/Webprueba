"use client"

import React, { useEffect, useState } from "react"
import useUser from "@/hooks/useUser"
import { supabase } from "@/lib/supabaseClient"
import type { ResolvedMembershipTier, MembershipTier } from "@/lib/memberships/tiers"
import { getBadgeTypeForTier, getLabelForTier, getPlanByTier } from "@/lib/memberships/tiers"
import MembershipBadge from "@/components/memberships/MembershipBadge"
import MembershipTierGrid from "@/components/memberships/MembershipTierGrid"
import MembershipPaymentModal from "@/components/memberships/MembershipPaymentModal"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import PromotionsManager from "@/components/dashboard/PromotionsManager"
import { toast } from "sonner"

interface ProfileMembership {
  subscription_tier: number
  subscription_end_date: string | null
}

export default function MembresiaPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [profileMembership, setProfileMembership] = useState<ProfileMembership | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<ResolvedMembershipTier | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfileMembership(null)
        setLoadingProfile(false)
        return
      }

      try {
        setLoadingProfile(true)
        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date")
          .eq("id", user.id)
          .single()

        if (error || !data) {
          console.warn("[membresia] No se pudo cargar subscription_tier desde profiles:", error)
          setProfileMembership({
            subscription_tier: 0,
            subscription_end_date: null
          })
        } else {
          setProfileMembership({
            subscription_tier: data.subscription_tier ?? 0,
            subscription_end_date: data.subscription_end_date ?? null
          })
        }
      } catch (err) {
        console.error("[membresia] Error cargando perfil:", err)
        setProfileMembership({
          subscription_tier: 0,
          subscription_end_date: null
        })
      } finally {
        setLoadingProfile(false)
      }
    }

    if (!userLoading) {
      loadProfile()
    }
  }, [user, userLoading])

  const handleSelectTier = (tierId: MembershipTier) => {
    // 1. Obtener plan exacto por ID
    const plan = getPlanByTier(tierId)

    if (!plan) {
      toast.error("Error", { description: "El plan seleccionado no es válido." })
      return
    }

    // 2. Construir el objeto de tier directamente
    const resolved: ResolvedMembershipTier = {
      tier: plan.tier,
      badgeType: getBadgeTypeForTier(plan.tier as MembershipTier),
      label: plan.name,
      baseAmount: plan.priceMonthly
    }

    setSelectedTier(resolved)
    setModalOpen(true)
  }

  const currentTier = profileMembership?.subscription_tier ?? 0
  const currentEnd = profileMembership?.subscription_end_date
  const currentBadgeType = getBadgeTypeForTier(currentTier as MembershipTier)

  const hasActiveSubscription =
    currentTier > 0 && currentEnd && new Date(currentEnd) > new Date()

  const currentPlanLabel = getLabelForTier((currentTier as MembershipTier) ?? 0)

  const formattedEndDate =
    currentEnd && hasActiveSubscription
      ? new Date(currentEnd).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "2-digit"
        })
      : null

  if (userLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-sm text-gray-300">Cargando membresía...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md bg-transparent backdrop-blur-sm rounded-3xl border border-white/10 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Sesión requerida</h1>
          <p className="mb-4 text-sm text-gray-400">
            Debes iniciar sesión para gestionar tu membresía.
          </p>
          <button
            type="button"
            onClick={() => router.push("/app/auth/login")}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  const isDev = process.env.NODE_ENV === "development"

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      {/* Header sticky */}
      <header className="sticky top-0 z-40 bg-gray-900/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-3 w-3" />
            Atrás
          </button>
          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Membresía Portal Encuentra
              </h1>
            </div>
            <p className="text-[11px] text-gray-400">
              Apoya el proyecto y obtén un badge especial en tu perfil
            </p>
          </div>
          <div className="w-[100px] text-right">
            {currentTier > 0 && <MembershipBadge type={currentBadgeType} />}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 px-4 space-y-6">
        {/* Estado actual */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/10 p-5 md:p-6 shadow-lg shadow-black/40 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-300">
                Estado de tu suscripción
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                {hasActiveSubscription
                  ? `Plan ${currentPlanLabel}`
                  : "Sin suscripción activa"}
              </h2>
              <p className="mt-1 text-xs text-blue-100">
                Tu apoyo ayuda a mantener el proyecto, mejorar el directorio y lanzar nuevas
                funciones para la comunidad.
              </p>
              {hasActiveSubscription && formattedEndDate && (
                <p className="mt-1 text-xs text-blue-200">
                  Vence el <span className="font-semibold">{formattedEndDate}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {currentTier > 0 ? (
                <>
                  <MembershipBadge type={currentBadgeType} />
                  <p className="text-[11px] text-blue-100">
                    Nivel actual:{" "}
                    <span className="font-semibold">
                      {currentPlanLabel} (Tier {currentTier})
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-blue-100">
                  Elige un nivel de apoyo para obtener tu badge.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Test mode toggle (solo desarrollo) */}
        {isDev && (
          <div className="flex items-center justify-end gap-2 text-[11px] text-gray-300">
            <label className="flex items-center gap-2">
              <span className="text-gray-400">Modo test (crypto mock)</span>
              <button
                type="button"
                onClick={() => setIsTestMode((v) => !v)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  isTestMode ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isTestMode ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        )}

        {/* Grid de tiers */}
        <MembershipTierGrid currentTier={currentTier} onSelectTier={handleSelectTier} />
      </main>

      <MembershipPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedTier={selectedTier}
        isTestMode={isTestMode}
      />
    </div>
  )
}


