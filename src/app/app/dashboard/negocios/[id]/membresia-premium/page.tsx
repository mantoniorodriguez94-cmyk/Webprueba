// src/app/dashboard/negocios/[id]/membresia-premium/page.tsx
"use client"
import React, { useEffect, useState, useCallback, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Image from "next/image"
import type { Business } from "@/types/business"
import { submitManualPayment } from "@/actions/payments"

type PremiumPlan = {
  id: string
  name: string
  price_usd: number
  billing_period: 'monthly' | 'yearly'
  description: string | null
  max_photos: number
  is_active: boolean
}

export default function MembresiaPremiumPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [plans, setPlans] = useState<PremiumPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PremiumPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'manual'>('paypal')
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'pago_movil' | 'zelle' | 'bank_transfer'>('pago_movil')
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [paypalSubmitting, setPaypalSubmitting] = useState(false)
  const businessId = params?.id as string
  
  // Detectar acción desde URL
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const action = searchParams.get('action') // 'renew' o 'change'
  const isRenewing = action === 'renew'
  const isChangingPlan = action === 'change'

  // Cargar datos del negocio y planes
  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || !user) return

      try {
        // Cargar negocio
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (businessError) {
          console.error("Error cargando negocio:", businessError)
          throw businessError
        }

        // Verificar que el usuario es el dueño
        if (businessData.owner_id !== user.id) {
          alert("No tienes permiso para gestionar este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(businessData)

        // Cargar planes premium (solo mensual y anual)
        const { data: plansData, error: plansError } = await supabase
          .from("premium_plans")
          .select("*")
          .eq('is_active', true)
          .order("price_usd", { ascending: true })

        if (plansError) {
          console.error("Error cargando planes:", plansError)
          throw plansError
        }

        const filteredPlans = (plansData || []).filter(
          plan => plan.billing_period === 'monthly' || plan.billing_period === 'yearly'
        )
        setPlans(filteredPlans)
        
        // Si el negocio es premium, obtener su plan actual basándose en la suscripción
        if (businessData.is_premium && businessData.premium_until && new Date(businessData.premium_until) > new Date()) {
          const { data: subscriptionData } = await supabase
            .from('business_subscriptions')
            .select('plan_id, premium_plans(*)')
            .eq('business_id', businessId)
            .eq('status', 'active')
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (subscriptionData && subscriptionData.premium_plans) {
            const currentPlanData = subscriptionData.premium_plans as any
            setCurrentPlan(currentPlanData)
            
            // Si es "renovar", pre-seleccionar el plan actual
            if (action === 'renew') {
              setSelectedPlan(currentPlanData)
            }
          }
        }
      } catch (error: any) {
        console.error("Error cargando datos:", error)
        alert(`Error al cargar la información: ${error.message || 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, user, router])

  const handlePlanSelect = (plan: PremiumPlan) => {
    setSelectedPlan(plan)
    setPaymentMethod('paypal') // Reset payment method
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePayPalPayment = async () => {
    if (!selectedPlan || !user) return

    setPaypalSubmitting(true)

    try {
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      // 1. Crear orden en PayPal
      const createResponse = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          business_id: businessId,
        }),
      })

      const createData = await createResponse.json()

      if (!createData.success) {
        throw new Error(createData.error || 'Error creando orden')
      }

      // 2. Redirigir a PayPal
      const paypalOrderId = createData.orderId
      const paymentId = createData.paymentId

      // En sandbox
      const paypalUrl = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
        ? `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`
        : `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`

      // Guardar paymentId en sessionStorage para recuperarlo después
      sessionStorage.setItem('pending_payment_id', paymentId)
      sessionStorage.setItem('pending_order_id', paypalOrderId)

      // Redirigir a PayPal
      window.location.href = paypalUrl

    } catch (err: any) {
      alert(err.message || 'Error procesando pago')
      setPaypalSubmitting(false)
    }
  }

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !screenshot || !user) return

    // Crear FormData para la Server Action
    const formData = new FormData()
    formData.append('plan_id', selectedPlan.id)
    formData.append('business_id', businessId)
    formData.append('payment_method', manualPaymentMethod)
    formData.append('reference', reference || '')
    formData.append('screenshot', screenshot)

    // Usar useTransition para manejar el estado de carga
    startTransition(async () => {
      try {
        const result = await submitManualPayment(formData)

        if (!result.success) {
          alert(result.error || 'Error enviando pago')
          return
        }

        // Éxito
        alert('¡Pago enviado exitosamente! Tu comprobante será verificado en 24-48 horas.')
        setSelectedPlan(null)
        setReference('')
        setScreenshot(null)
        router.push(`/app/dashboard/negocios/${businessId}/gestionar`)

      } catch (err: any) {
        console.error('Error en handleManualPayment:', err)
        alert(err.message || 'Error enviando pago manual')
      }
    })
  }

  const isPremiumActive = business?.is_premium && business?.premium_until && new Date(business.premium_until) > new Date()
  const daysRemaining = business?.premium_until 
    ? Math.ceil((new Date(business.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Negocio no encontrado</h2>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-amber-500/20 rounded-full transition-colors"
                aria-label="Volver atrás"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Membresía Premium
                </h1>
                <p className="text-sm text-gray-300 mt-1">{business.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estado Actual de la Membresía */}
        {isPremiumActive && (
          <div className="mb-8 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <h2 className="text-2xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ¡Membresía Premium Activa!
                </h2>
                <p className="text-gray-300 text-sm sm:text-base">
                  Tu negocio está disfrutando de todos los beneficios premium
                </p>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl px-4 py-3 text-center">
                <p className="text-xs text-amber-300 mb-1">Expira en</p>
                <p className="text-2xl font-bold text-amber-400">{daysRemaining}</p>
                <p className="text-xs text-amber-300">días</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-amber-500/10 rounded-xl">
              <p className="text-sm text-gray-300">
                <strong className="text-amber-400">Fecha de expiración:</strong>{" "}
                {new Date(business.premium_until!).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Intro */}
        <div className="text-center mb-12">
          {isRenewing ? (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                🔄 Renovar Membresía Premium
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Extiende tu membresía <strong className="text-amber-400">{currentPlan?.name || 'Premium'}</strong> para <strong className="text-amber-400">{business.name}</strong>.
                Los días restantes se sumarán automáticamente.
              </p>
            </>
          ) : isChangingPlan ? (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                💎 Cambiar Plan de Membresía
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Elige un nuevo plan para <strong className="text-amber-400">{business.name}</strong>.
                Los días restantes de tu plan actual se sumarán al nuevo.
              </p>
            </>
          ) : !isPremiumActive ? (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Lleva tu negocio al siguiente nivel
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Activa la membresía premium para <strong className="text-amber-400">{business.name}</strong> y destaca entre la competencia con beneficios exclusivos.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Gestiona tu Membresía Premium
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Los días restantes de tu membresía actual se sumarán automáticamente a tu nueva suscripción.
              </p>
            </>
          )}
        </div>

        {/* Planes - Solo mostrar si NO es renovación O si no hay plan seleccionado */}
        {(!isRenewing || !selectedPlan) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan)}
              className={`bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 p-8 cursor-pointer transition-all transform hover:scale-105 ${
                selectedPlan?.id === plan.id
                  ? "border-amber-500 ring-4 ring-amber-500/30"
                  : "border-white/20 hover:border-amber-500/50"
              }`}
            >
              {plan.billing_period === 'yearly' && (
                <div className="mb-4">
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold">
                    ⭐ AHORRA MÁS
                  </span>
                </div>
              )}

              <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-amber-400">${plan.price_usd}</span>
                <span className="text-gray-400 ml-2">
                  {plan.billing_period === 'monthly' ? '/mes' : '/año'}
                </span>
                {plan.billing_period === 'yearly' && (
                  <div className="mt-3 inline-block">
                    <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-2">
                      <p className="text-green-300 text-sm font-semibold">
                        💰 Solo ${(plan.price_usd / 12).toFixed(2)} USD/mes
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {plan.description && (
                <p className="text-gray-300 mb-6">{plan.description}</p>
              )}

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Aparece en Destacados
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Badge Premium
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Control de Borde Dorado ({plan.billing_period === 'yearly' ? '2 negocios' : '1 negocio'})
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Hasta {plan.max_photos} fotos en galería
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mayor visibilidad en búsquedas
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Estadísticas avanzadas
                </li>
              </ul>
            </div>
            ))}
          </div>
        )}

        {/* Info del plan seleccionado para renovación */}
        {isRenewing && selectedPlan && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/40 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Plan a Renovar</h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-amber-400">${selectedPlan.price_usd}</p>
                <p className="text-gray-300 mt-2">
                  {selectedPlan.billing_period === 'monthly' ? 'por mes' : 'por año'}
                </p>
              </div>
            </div>
            <p className="text-center text-amber-300 mb-4">
              ⏱️ Se sumarán {selectedPlan.billing_period === 'monthly' ? '30' : '365'} días a tu membresía actual
            </p>
            <p className="text-center text-gray-400 text-sm">
              {daysRemaining} días restantes + {selectedPlan.billing_period === 'monthly' ? '30' : '365'} días nuevos = {daysRemaining + (selectedPlan.billing_period === 'monthly' ? 30 : 365)} días totales
            </p>
          </div>
        )}

        {/* Métodos de Pago */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Selecciona tu método de pago</h3>
            
            <div className="space-y-4 mb-6">
              {/* PayPal */}
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full p-6 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/20 hover:border-blue-500/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.85.85 0 0 1 .838-.71h6.55c3.718 0 5.961 1.712 5.961 5.147 0 3.747-2.73 6.263-6.72 6.263H8.385l-1.31 7.917zm8.844-14.893c0-2.015-1.245-2.964-3.706-2.964H10.03l-1.569 9.48h1.89c2.95 0 5.569-2.07 5.569-6.516z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white">PayPal</p>
                    <p className="text-sm text-gray-400">Pago rápido y seguro</p>
                  </div>
                  {paymentMethod === 'paypal' && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Pago Manual */}
              <button
                onClick={() => setPaymentMethod('manual')}
                className={`w-full p-6 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'manual'
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/20 hover:border-green-500/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white">Transferencia / Pago Móvil</p>
                    <p className="text-sm text-gray-400">Envía comprobante para verificación</p>
                  </div>
                  {paymentMethod === 'manual' && (
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* PayPal */}
            {paymentMethod === 'paypal' && (
              <div className="mt-6">
                <button
                  onClick={handlePayPalPayment}
                  disabled={paypalSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paypalSubmitting ? 'Procesando...' : `Pagar $${selectedPlan.price_usd} con PayPal`}
                </button>
                <p className="text-gray-400 text-sm mt-3 text-center">
                  Serás redirigido a PayPal para completar tu pago de forma segura
                </p>
              </div>
            )}

            {/* Pago Manual */}
            {paymentMethod === 'manual' && (
              <form onSubmit={handleManualPayment} className="space-y-4 mt-6">
                {/* Pago Móvil BDV */}
                <div className="bg-gradient-to-r from-[#004B93] to-[#0066CC] rounded-lg p-5 mb-4">
                  <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    Pago Móvil - Banco de Venezuela
                  </h4>
                  
                  {/* Datos para copiar */}
                  <div className="space-y-3 mb-5">
                    <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-blue-200 text-xs">Teléfono</p>
                        <p className="text-white font-mono font-bold text-lg">0426-1010281</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('04261010281', 'telefono')}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          copiedField === 'telefono' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        {copiedField === 'telefono' ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-blue-200 text-xs">Cédula</p>
                        <p className="text-white font-mono font-bold text-lg">V-23480465</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('23480465', 'cedula')}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          copiedField === 'cedula' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        {copiedField === 'cedula' ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-blue-200 text-xs">Banco</p>
                        <p className="text-white font-bold">Banco de Venezuela (0102)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('0102', 'banco')}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          copiedField === 'banco' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        {copiedField === 'banco' ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    
                    <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-yellow-200 text-xs">Monto a pagar</p>
                        <p className="text-yellow-300 font-mono font-bold text-xl">${selectedPlan.price_usd} USD</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedPlan.price_usd.toString(), 'monto')}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          copiedField === 'monto' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-200'
                        }`}
                      >
                        {copiedField === 'monto' ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Botón copiar todos los datos */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(
                      `Pago Móvil BDV\nTeléfono: 04261010281\nCédula: V-23480465\nBanco: 0102\nMonto: $${selectedPlan.price_usd}`,
                      'todos'
                    )}
                    className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg transition-all shadow-lg mb-3 font-bold ${
                      copiedField === 'todos'
                        ? 'bg-green-500 text-white'
                        : 'bg-white hover:bg-gray-100 text-[#004B93]'
                    }`}
                  >
                    {copiedField === 'todos' ? (
                      <>✅ ¡Todos los datos copiados!</>
                    ) : (
                      <>
                        <span className="text-xl">📋</span>
                        Copiar todos los datos
                      </>
                    )}
                  </button>

                  {/* Botón para abrir app del banco */}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.bdv.movil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-3"
                  >
                    <span className="text-xl">📱</span>
                    Abrir/Descargar App BDV
                  </a>
                  
                  <p className="text-blue-100 text-xs text-center">
                    Copia los datos arriba y realiza el pago móvil desde tu app del banco.
                    <br />Luego sube el comprobante abajo para activar tu Premium.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800 text-gray-400">o paga con otro método</span>
                  </div>
                </div>

                {/* Instrucciones */}
                <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Instrucciones de Pago</h4>
                  <div className="text-gray-300 text-sm space-y-1">
                    <p><strong>Zelle:</strong> pagos@encuentra.com</p>
                    <p><strong>Banco Nacional:</strong> Cuenta 1234-5678-9012</p>
                    <p><strong>Monto:</strong> ${selectedPlan.price_usd} USD</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Método de Pago</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pago_movil">Pago Móvil Venezuela</option>
                    <option value="zelle">Zelle</option>
                    <option value="bank_transfer">Transferencia Bancaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Referencia / Número de Confirmación</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Captura de Pantalla del Pago *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    required
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Sube una foto clara del comprobante de pago
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !screenshot}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </span>
                  ) : (
                    'Enviar para Verificación'
                  )}
                </button>

                <p className="text-gray-400 text-sm text-center">
                  Tu pago será verificado manualmente en 24-48 horas
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

