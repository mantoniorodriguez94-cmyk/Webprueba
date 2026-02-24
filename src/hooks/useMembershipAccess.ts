// src/hooks/useMembershipAccess.ts
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "./useUser"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

interface MembershipAccess {
  tier: SubscriptionTier
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
          const isActive =
            tier > 0 &&
            endDate !== null &&
            !Number.isNaN(new Date(endDate).getTime()) &&
            new Date(endDate) > new Date()

          setMembership({
            tier,
            subscriptionEndDate: endDate,
            hasActiveSubscription: isActive,
            loading: false,
            extraBusinessLimit
          })
        } catch {
          setMembership({
            tier: 0,
            subscriptionEndDate: null,
            hasActiveSubscription: false,
            loading: false,
            extraBusinessLimit: 0
          })
        }
      } catch (_err) {
        setMembership({
          tier: 0,
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
   * @param requiredTier - Tier mínimo requerido (1 = Conecta, 2 = Destaca, 3 = Fundador)
   * @returns true si el usuario tiene el tier requerido y la suscripción está activa
   */
  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (requiredTier === 0) return true // Básico siempre accesible
    if (membership.loading) return false
    if (!membership.hasActiveSubscription) return false
    return membership.tier >= requiredTier
  }

  return {
    ...membership,
    hasAccess
  }
}

