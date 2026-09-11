"use client"

import React, { useEffect, useState } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import useUser from "@/hooks/useUser"
import { supabase } from "@/lib/supabaseClient"
import type { ResolvedMembershipTier, MembershipTier } from "@/lib/memberships/tiers"
import { getBadgeTypeForTier, getLabelForTier, getPlanByTier } from "@/lib/memberships/tiers"
import MembershipBadge from "@/components/memberships/MembershipBadge"
import MembershipTierGrid from "@/components/memberships/MembershipTierGrid"
import MembershipPaymentModal from "@/components/memberships/MembershipPaymentModal"
import { Sparkles } from "lucide-react"
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
          .maybeSingle()

        if (error || !data) {
          if (error) console.warn("[membresia] Error cargando subscription_tier desde profiles:", error)
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
    // Los planes se ven sin cuenta a propósito: el precio es la primera
    // pregunta de cualquiera y la landing ya lo publica. La cuenta se pide
    // recién al momento de suscribirse, que es cuando hace falta de verdad.
    if (!user) {
      router.push(
        `/app/auth/register?next=${encodeURIComponent("/app/dashboard/membresia")}`
      )
      return
    }

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
  const currentEnd = profileMembership?.subscription_end_date ?? null
  const currentBadgeType = getBadgeTypeForTier(currentTier as MembershipTier)

  // ── Single Source of Truth for "is this subscription active?" ────────────
  // Mirrors the identical rule in useMembershipAccess so the UI can NEVER
  // show conflicting signals:
  //   • tier > 0  AND
  //   • end date is null (admin-granted / indefinite)  OR  end date is future
  const endDateIsValid =
    currentEnd !== null &&
    !Number.isNaN(new Date(currentEnd).getTime()) &&
    new Date(currentEnd) > new Date()

  const hasActiveSubscription =
    currentTier > 0 && (currentEnd === null || endDateIsValid)

  const currentPlanLabel = getLabelForTier((currentTier as MembershipTier) ?? 0)

  // Expiry display:
  //  • future date  → localized date string
  //  • null         → "Acceso permanente" (admin-granted / no expiry set)
  //  • inactive     → null (no label shown)
  const formattedEndDate: string | null = hasActiveSubscription
    ? currentEnd === null
      ? "Acceso permanente"
      : new Date(currentEnd).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
    : null

  // Solo esperamos el perfil cuando hay alguien con sesión: un visitante sin
  // cuenta no tiene perfil que cargar, y bloquearlo tras un cargador le
  // esconde justamente lo que vino a ver (los precios).
  if (userLoading || (user && loadingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-sm text-ink-2">Cargando membresía...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:pb-10">
      <SectionHeader
        titulo="Membresía"
        subtitulo="Apoya el proyecto y obtén un badge especial en tu perfil"
        icono={<Sparkles className="h-5 w-5" />}
        ancho="7xl"
        acciones={
          hasActiveSubscription ? <MembershipBadge type={currentBadgeType} /> : undefined
        }
        variante="portada"
      />

      <main className="max-w-7xl mx-auto mt-6 px-4 space-y-6">
        {/* Estado actual */}
        <div className="surface-elevated rounded-3xl p-5 md:p-6 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">
                {user ? "Estado de tu suscripción" : "Planes de apoyo"}
              </p>
              <h2 className="mt-1 text-lg font-bold text-ink">
                {!user
                  ? "Elige el nivel que quieras"
                  : hasActiveSubscription
                    ? `Plan ${currentPlanLabel}`
                    : "Sin suscripción activa"}
              </h2>
              <p className="mt-1 text-xs text-ink-2">
                Tu apoyo ayuda a mantener el proyecto, mejorar el directorio y lanzar nuevas
                funciones para la comunidad.
              </p>
              {hasActiveSubscription && formattedEndDate && (
                <p className="mt-1 text-xs text-ink-2">
                  {formattedEndDate === "Acceso permanente" ? (
                    <span className="font-semibold text-green-600">✓ {formattedEndDate}</span>
                  ) : (
                    <>
                      Vence el{" "}
                      <span className="font-semibold text-ink">{formattedEndDate}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {/* Gate BOTH the badge and the level label on hasActiveSubscription.
                  Using currentTier > 0 alone creates a split-brain UI when the tier
                  is set but subscription_end_date has already expired. */}
              {hasActiveSubscription ? (
                <>
                  <MembershipBadge type={currentBadgeType} />
                  <p className="text-[11px] text-ink-2">
                    Nivel actual:{" "}
                    <span className="font-semibold text-ink">
                      {currentPlanLabel} (Tier {currentTier})
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-ink-2">
                  {user
                    ? "Elige un nivel de apoyo para obtener tu badge."
                    : "Puedes ver todos los planes y sus precios. La cuenta se pide al suscribirte."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Grid de tiers */}
        <MembershipTierGrid currentTier={currentTier} onSelectTier={handleSelectTier} />

        {/* Métodos de pago disponibles para cualquier nivel */}
        <div className="surface rounded-3xl p-4 text-center">
          <p className="text-xs text-ink-2">
            Elige un nivel y paga con{" "}
            <span className="font-semibold text-ink">PayPal</span>,{" "}
            <span className="font-semibold text-ink">Binance Pay</span> o por{" "}
            <span className="font-semibold text-ink">transferencia / pago móvil</span>.
          </p>
          <p className="mt-1 text-[11px] text-ink-2">
            Con transferencia subes el comprobante y un administrador lo verifica (hasta 24 horas).
          </p>
        </div>
      </main>

      <MembershipPaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedTier={selectedTier}
      />
    </div>
  )
}


