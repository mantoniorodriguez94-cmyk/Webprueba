// src/hooks/useMembershipAccess.ts
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "./useUser"
import { isTierActive, type SubscriptionTier } from "@/lib/memberships/tiers"

interface MembershipAccess {
  /**
   * Raw tier value from the database (0–3).
   * NOTE: this can be > 0 even when the subscription has expired.
   * Use `effectiveTier` for access-control decisions, or call `hasAccess()`.
   */
  tier: SubscriptionTier
  /**
   * The tier the user is *actually operating at right now*.
   *
   * Equals `tier` when hasActiveSubscription is true.
   * Equals 0 (Básico) when the subscription has expired or is absent.
   *
   * This is the value to use anywhere you need "what can this user do?".
   * It makes it architecturally impossible to gate access on a stale/expired tier.
   */
  effectiveTier: SubscriptionTier
  subscriptionEndDate: string | null
  hasActiveSubscription: boolean
  loading: boolean
  extraBusinessLimit: number
}

/**
 * Hook para gestionar el acceso basado en membresías.
 * 
 * Retorna:
 * - tier: Nivel actual de suscripción (0-3)
 * - subscriptionEndDate: Fecha de expiración o null
 * - hasActiveSubscription: true si tier > 0 y no expirado
 * - loading: Estado de carga
 * - hasAccess(requiredTier): Función para verificar acceso
 */
export default function useMembershipAccess() {
  const { user, loading: userLoading } = useUser()
  const [membership, setMembership] = useState<MembershipAccess>({
    tier: 0,
    effectiveTier: 0,
    subscriptionEndDate: null,
    hasActiveSubscription: false,
    loading: true,
    extraBusinessLimit: 0
  })

  useEffect(() => {
    const loadMembership = async () => {
      if (userLoading) {
        setMembership((prev) => ({ ...prev, loading: true }))
        return
      }

      if (!user) {
        setMembership({
          tier: 0,
          effectiveTier: 0,
          subscriptionEndDate: null,
          hasActiveSubscription: false,
          loading: false,
          extraBusinessLimit: 0
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date, extra_business_limit")
          .eq("id", user.id)
          .maybeSingle()

        if (error) {
          setMembership({
            tier: 0,
            effectiveTier: 0,
            subscriptionEndDate: null,
            hasActiveSubscription: false,
            loading: false,
            extraBusinessLimit: 0
          })
          return
        }

        try {
          const rawTier = data?.subscription_tier
          const tier = Math.min(3, Math.max(0, Number(rawTier) || 0)) as SubscriptionTier
          const rawEndDate = data?.subscription_end_date
          const endDate =
            rawEndDate != null && String(rawEndDate).trim() !== ""
              ? String(rawEndDate)
              : null
          const extraBusinessLimit = Math.max(
            0,
            Number((data as { extra_business_limit?: number })?.extra_business_limit) || 0
          )

          const isActive = isTierActive(tier, endDate)

          // effectiveTier: the tier the user can ACTUALLY USE right now.
          // When the subscription is expired, this collapses to 0 (Básico) so
          // no consumer can accidentally grant access based on a stale tier value.
          const effectiveTier = (isActive ? tier : 0) as SubscriptionTier

          setMembership({
            tier,
            effectiveTier,
            subscriptionEndDate: endDate,
            hasActiveSubscription: isActive,
            loading: false,
            extraBusinessLimit
          })
        } catch {
          setMembership({
            tier: 0,
            effectiveTier: 0,
            subscriptionEndDate: null,
            hasActiveSubscription: false,
            loading: false,
            extraBusinessLimit: 0
          })
        }
      } catch (_err) {
        setMembership({
          tier: 0,
          effectiveTier: 0,
          subscriptionEndDate: null,
          hasActiveSubscription: false,
          loading: false,
          extraBusinessLimit: 0
        })
      }
    }

    loadMembership()
  }, [user, userLoading])

  /**
   * Verifica si el usuario tiene acceso a una característica que requiere un tier mínimo.
   * 
   * @param requiredTier - Tier mínimo requerido (1 = Conecta, 2 = Destaca, 3 = Patrocina)
   * @returns true si el usuario tiene el tier requerido y la suscripción está activa
   */
  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (requiredTier === 0) return true // Básico siempre accesible
    if (membership.loading) return false
    // effectiveTier already collapses to 0 when the subscription expired
    return membership.effectiveTier >= requiredTier
  }

  return {
    ...membership,
    hasAccess
  }
}

