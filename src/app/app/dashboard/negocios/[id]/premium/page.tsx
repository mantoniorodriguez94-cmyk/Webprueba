"use client"

/**
 * Página de Suscripción Premium
 * Permite a los dueños de negocios suscribirse a planes premium
 * Métodos de pago: PayPal y Manual (Zelle/Banco)
 */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import type { PremiumPlan, BusinessSubscriptionWithPlan } from "@/types/subscriptions"
import type { Business } from "@/types/business"

export default function PremiumPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params?.id as string
  const { user } = useUser()

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)
  const [plans, setPlans] = useState<PremiumPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<BusinessSubscriptionWithPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'manual'>('paypal')
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'zelle' | 'bank_transfer'>('zelle')
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [businessId, user])

  const loadData = async () => {
    try {
      if (!user) {
        router.push('/app/auth/login')
        return
      }

      // Cargar negocio
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .eq('owner_id', user.id)
        .single()

      if (businessError || !businessData) {
        setError('Negocio no encontrado')
        return
      }

      setBusiness(businessData)

      // Cargar planes disponibles
      const { data: plansData, error: plansError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true })

      if (plansError) throw plansError
      setPlans(plansData || [])

      // Cargar suscripción actual si existe
      const { data: subData } = await supabase
        .from('business_subscriptions')
        .select(`
          *,
          plan:premium_plans(*)
        `)
        .eq('business_id', businessId)
        .eq('status', 'active')
        .single()

      if (subData) {
        setCurrentSubscription(subData as any)
      }

    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayPalPayment = async () => {
    if (!selectedPlan || !user) return

    setSubmitting(true)
    setError('')

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
      setError(err.message || 'Error procesando pago')
      setSubmitting(false)
    }
  }

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !screenshot || !user) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      const formData = new FormData()
      formData.append('plan_id', selectedPlan.id)
      formData.append('business_id', businessId)
      formData.append('payment_method', manualPaymentMethod)
      formData.append('reference', reference)
      formData.append('screenshot', screenshot)

      const response = await fetch('/api/payments/manual/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error enviando pago')
      }

      setSuccess('¡Pago enviado exitosamente! Tu solicitud será revisada pronto.')
      setSelectedPlan(null)
      setReference('')
      setScreenshot(null)

      // Recargar datos después de 2 segundos
      setTimeout(() => {
        loadData()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Error enviando pago manual')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysRemaining = () => {
    if (!currentSubscription) return null
    const now = new Date()
    const endDate = new Date(currentSubscription.end_date)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Negocio no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Premium</h1>
            <p className="text-sm text-gray-400">{business.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estado Actual */}
        {currentSubscription && (
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div>
                <h2 className="text-2xl font-bold text-white">¡Eres Premium!</h2>
                <p className="text-yellow-100">{currentSubscription.plan.name}</p>
              </div>
            </div>
            <div className="flex gap-6 text-white">
              <div>
                <p className="text-yellow-100 text-sm">Expira el</p>
                <p className="font-semibold">{formatDate(currentSubscription.end_date)}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-sm">Días restantes</p>
                <p className="font-semibold">{getDaysRemaining()} días</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Planes Disponibles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentSubscription ? 'Renovar o Cambiar Plan' : 'Elige tu Plan Premium'}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-gray-800 border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                  </div>
                  {selectedPlan?.id === plan.id && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="text-3xl font-bold text-white mb-4">
                  ${plan.price_usd}
                  <span className="text-base text-gray-400 font-normal">
                    /{plan.billing_period === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Aparece en Destacados
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Badge Premium
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Hasta {plan.max_photos} fotos
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mayor visibilidad
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Métodos de Pago */}
        {selectedPlan && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">Método de Pago</h3>

            {/* Selector de Método */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-white font-semibold mb-1">PayPal</div>
                <div className="text-gray-400 text-sm">Pago automático</div>
              </button>

              <button
                onClick={() => setPaymentMethod('manual')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'manual'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-white font-semibold mb-1">Pago Manual</div>
                <div className="text-gray-400 text-sm">Zelle / Banco</div>
              </button>
            </div>

            {/* PayPal */}
            {paymentMethod === 'paypal' && (
              <div>
                <button
                  onClick={handlePayPalPayment}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Procesando...' : `Pagar $${selectedPlan.price_usd} con PayPal`}
                </button>
                <p className="text-gray-400 text-sm mt-3 text-center">
                  Serás redirigido a PayPal para completar tu pago de forma segura
                </p>
              </div>
            )}

            {/* Pago Manual */}
            {paymentMethod === 'manual' && (
              <form onSubmit={handleManualPayment} className="space-y-4">
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
                  disabled={submitting || !screenshot}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar para Verificación'}
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

