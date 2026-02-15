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
    loading: true
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
          loading: false
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("[membership] Error cargando suscripción:", error)
          setMembership({
            tier: 0,
            subscriptionEndDate: null,
            hasActiveSubscription: false,
            loading: false
          })
          return
        }

        const tier = (data?.subscription_tier ?? 0) as SubscriptionTier
        const endDate = data?.subscription_end_date ?? null
        const isActive =
          tier > 0 &&
          endDate !== null &&
          new Date(endDate) > new Date()

        setMembership({
          tier,
          subscriptionEndDate: endDate,
          hasActiveSubscription: isActive,
          loading: false
        })
      } catch (err) {
        console.error("[membership] Error inesperado:", err)
        setMembership({
          tier: 0,
          subscriptionEndDate: null,
          hasActiveSubscription: false,
          loading: false
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
    if (requiredTier === 0) return true // Gratis siempre accesible
    if (membership.loading) return false
    if (!membership.hasActiveSubscription) return false
    return membership.tier >= requiredTier
  }

  return {
    ...membership,
    hasAccess
  }
}

