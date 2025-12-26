"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import type { BusinessSubscriptionWithPlan } from "@/types/subscriptions"
import type { Business } from "@/types/business"

interface PremiumMembershipSectionProps {
  businessId: string
  business: Business
  onUpdate?: () => void
}

export default function PremiumMembershipSection({
  businessId,
  business,
  onUpdate
}: PremiumMembershipSectionProps) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<BusinessSubscriptionWithPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingBorder, setUpdatingBorder] = useState(false)
  const [hasGoldenBorder, setHasGoldenBorder] = useState(business.has_golden_border ?? true)

  // Cargar suscripción actual
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from("business_subscriptions")
          .select(`
            *,
            plan:premium_plans(*)
          `)
          .eq("business_id", businessId)
          .eq("status", "active")
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error cargando suscripción:", error)
        } else if (data) {
          setSubscription(data as BusinessSubscriptionWithPlan)
        }
      } catch (error) {
        console.error("Error cargando suscripción:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [businessId])

  // Actualizar has_golden_border cuando cambia en el prop
  useEffect(() => {
    setHasGoldenBorder(business.has_golden_border ?? true)
  }, [business.has_golden_border])

  // Calcular días restantes
  const calculateDaysRemaining = (): number | null => {
    if (!subscription?.end_date) return null
    const endDate = new Date(subscription.end_date)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = calculateDaysRemaining()
  const isExpired = daysRemaining !== null && daysRemaining <= 0
  const planType = subscription?.plan?.billing_period // 'monthly' | 'yearly' | undefined

  // Manejar cambio de borde dorado
  const handleToggleGoldenBorder = async (checked: boolean) => {
    setUpdatingBorder(true)
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ has_golden_border: checked })
        .eq("id", businessId)

      if (error) throw error

      setHasGoldenBorder(checked)
      onUpdate?.() // Notificar al componente padre
    } catch (error) {
      console.error("Error actualizando borde dorado:", error)
      alert("Error al actualizar el borde dorado. Por favor, intenta de nuevo.")
    } finally {
      setUpdatingBorder(false)
    }
  }

  // Manejar renovación
  const handleRenew = () => {
    router.push(`/app/dashboard/negocios/${businessId}/premium?action=renew`)
  }

  // Manejar upgrade a anual
  const handleUpgradeToAnnual = () => {
    router.push(`/app/dashboard/negocios/${businessId}/premium?action=upgrade&plan=annual`)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Traducir billing_period
  const getPlanTypeLabel = (billingPeriod: string | undefined): string => {
    if (billingPeriod === 'monthly') return 'Mensual'
    if (billingPeriod === 'yearly') return 'Anual'
    return 'Premium'
  }

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Si no hay suscripción activa
  if (!subscription) {
    return (
      <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Membresía Premium</h2>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <p className="text-gray-300 text-center">
            Tu negocio no tiene una membresía premium activa.
          </p>
        </div>

        <button
          onClick={() => router.push(`/app/dashboard/negocios/${businessId}/premium`)}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-semibold"
        >
          Obtener Membresía Premium
        </button>
      </div>
    )
  }

  return (
    <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 sm:p-8">
      {/* Header con Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Membresía Premium</h2>
        </div>

        {/* Switch de Borde Dorado */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300 font-medium">
            Mostrar Borde Dorado Premium
          </label>
          <button
            onClick={() => handleToggleGoldenBorder(!hasGoldenBorder)}
            disabled={updatingBorder}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              hasGoldenBorder ? 'bg-yellow-500' : 'bg-gray-600'
            } ${updatingBorder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            role="switch"
            aria-checked={hasGoldenBorder}
            aria-label="Toggle borde dorado"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hasGoldenBorder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Detalles de la Suscripción */}
      <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 rounded-2xl p-6 mb-6 border border-yellow-500/20">
        <div className="space-y-4">
          {/* Plan y Estado */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-gray-400 mb-1">Plan Actual</p>
              <p className="text-lg font-bold text-white">
                {subscription.plan.name} ({getPlanTypeLabel(planType)})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Estado</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                isExpired 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {isExpired ? 'Vencido' : 'Activo'}
              </span>
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Fecha de Vencimiento</p>
            <p className="text-base font-medium text-white">
              {formatDate(subscription.end_date)}
            </p>
          </div>

          {/* Días Restantes */}
          {daysRemaining !== null && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Días Restantes</p>
              <p className={`text-2xl font-bold ${
                daysRemaining <= 7 
                  ? 'text-red-400' 
                  : daysRemaining <= 30 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
              }`}>
                {daysRemaining > 0 ? daysRemaining : 0} día{daysRemaining !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="space-y-3">
        {/* Botón Renovar (solo si daysRemaining <= 7) */}
        {daysRemaining !== null && daysRemaining <= 7 && (
          <button
            onClick={handleRenew}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-semibold"
          >
            {isExpired ? 'Renovar Membresía' : 'Renovar Membresía (Próximo a vencer)'}
          </button>
        )}

        {/* Botón Upgrade a Anual (solo si plan_type === 'monthly') */}
        {planType === 'monthly' && !isExpired && (
          <button
            onClick={handleUpgradeToAnnual}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-semibold"
          >
            Cambiar a Plan Anual
          </button>
        )}
      </div>
    </div>
  )
}

