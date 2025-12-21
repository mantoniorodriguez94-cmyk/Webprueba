"use client"

/**
 * Página de Suscripción Premium
 * Permite a los dueños de negocios suscribirse a planes premium
 * Métodos de pago: PayPal y Manual (Zelle/Banco)
 */

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import type { PremiumPlan, BusinessSubscriptionWithPlan } from "@/types/subscriptions"
import type { Business } from "@/types/business"
import { submitManualPayment } from "@/actions/payments"

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
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'pago_movil' | 'zelle' | 'bank_transfer'>('pago_movil')
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string; details?: string }>({
    show: false,
    message: '',
    details: undefined
  })

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Función para obtener detalles del error y sugerencias
  const getErrorDetails = (errorMessage: string): string | undefined => {
    const lowerError = errorMessage.toLowerCase()
    
    if (lowerError.includes('faltan campos requeridos') || lowerError.includes('campos requeridos')) {
      return 'Por favor, asegúrate de completar todos los campos del formulario, incluyendo la selección del método de pago y la captura de pantalla del comprobante.'
    }
    
    if (lowerError.includes('imagen') || lowerError.includes('archivo debe ser')) {
      return 'Solo se permiten archivos de imagen. Formatos aceptados: JPEG, PNG, WEBP o GIF. Por favor, selecciona una imagen válida.'
    }
    
    if (lowerError.includes('demasiado grande') || lowerError.includes('10mb') || lowerError.includes('tamaño')) {
      return 'El tamaño máximo permitido es 10MB. Por favor, comprime la imagen o selecciona una con menor tamaño. Puedes usar herramientas online de compresión de imágenes.'
    }
    
    if (lowerError.includes('subir') || lowerError.includes('upload')) {
      return 'Hubo un problema al subir tu imagen. Por favor, verifica tu conexión a internet e intenta nuevamente. Si el problema persiste, intenta con una imagen diferente.'
    }
    
    if (lowerError.includes('negocio no encontrado') || lowerError.includes('no autorizado')) {
      return 'No tienes permisos para realizar esta acción en este negocio. Por favor, verifica que estés usando la cuenta correcta.'
    }
    
    if (lowerError.includes('plan') && (lowerError.includes('no encontrado') || lowerError.includes('no está disponible'))) {
      return 'El plan seleccionado ya no está disponible. Por favor, selecciona otro plan o recarga la página para ver los planes actualizados.'
    }
    
    if (lowerError.includes('registrar') || lowerError.includes('registro')) {
      return 'Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente. Si el problema persiste, contacta al soporte.'
    }
    
    if (lowerError.includes('autenticado') || lowerError.includes('sesión')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente e intenta de nuevo.'
    }
    
    return 'Por favor, verifica que todos los campos estén completos correctamente e intenta nuevamente. Si el problema persiste, contacta al soporte.'
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const [paypalSubmitting, setPaypalSubmitting] = useState(false)

  const handlePayPalPayment = async () => {
    if (!selectedPlan || !user) return

    setPaypalSubmitting(true)
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
      setPaypalSubmitting(false)
    }
  }

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !screenshot || !user) return

    setError('')
    setSuccess('')

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
          // Mostrar modal de error con mensaje detallado
          const errorMessage = result.error || 'Error enviando pago'
          setErrorModal({
            show: true,
            message: errorMessage,
            details: getErrorDetails(errorMessage)
          })
          return
        }

        // Éxito - Mostrar modal de éxito
        setShowSuccessModal(true)
        setSelectedPlan(null)
        setReference('')
        setScreenshot(null)

        // Recargar datos después de cerrar el modal
        // (se hará en el onClose del modal)

      } catch (err: any) {
        console.error('Error en handleManualPayment:', err)
        setError(err.message || 'Error enviando pago manual')
      }
    })
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
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/10 backdrop-blur-md border-b border-white/10">
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
        {currentSubscription && currentSubscription.plan && (
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

        {/* Modal de Éxito - Pop-up Obligatorio (Solo se puede cerrar con el botón) */}
        {showSuccessModal && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-lg w-full mx-4 border-2 border-green-500 shadow-2xl shadow-green-500/30 transform transition-all animate-scaleIn"
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              {/* Icono de éxito */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                ¡Pago Enviado Exitosamente!
              </h2>

              {/* Mensaje */}
              <div className="space-y-4 mb-6">
                <p className="text-gray-300 text-center leading-relaxed">
                  Tu comprobante de pago ha sido recibido correctamente. 
                </p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-blue-300 font-medium mb-1">Próximos pasos</p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Nuestro equipo verificará tu pago y activará tu suscripción premium en un plazo máximo de <span className="font-semibold text-white">24 horas</span>. 
                        Te notificaremos cuando tu plan esté activo.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm text-center">
                  Puedes cerrar esta ventana y continuar navegando.
                </p>
              </div>

              {/* Botón de cierre */}
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  loadData()
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Modal de Error - Pop-up Obligatorio (Solo se puede cerrar con el botón) */}
        {errorModal.show && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-lg w-full mx-4 border-2 border-red-500 shadow-2xl shadow-red-500/30"
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              {/* Icono de error */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                Error al Enviar el Pago
              </h2>

              {/* Mensaje de error */}
              <div className="space-y-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-300 font-medium text-center">
                    {errorModal.message}
                  </p>
                </div>

                {/* Detalles y sugerencias */}
                {errorModal.details && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-blue-300 font-medium mb-2">¿Qué puedo hacer?</p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {errorModal.details}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips adicionales */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs text-center">
                    💡 Tip: Asegúrate de que la imagen del comprobante sea clara y completa
                  </p>
                </div>
              </div>

              {/* Botón de cierre */}
              <button
                onClick={() => {
                  setErrorModal({ show: false, message: '', details: undefined })
                }}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Planes Disponibles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentSubscription ? 'Renovar o Cambiar Plan' : 'Elige tu Plan Premium'}
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`mt-3 bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/20 transition-all cursor-pointer ${
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
                    /{plan.billing_period === 'monthly' ? 'mes' : 
                      plan.billing_period === 'quarterly' ? '3 meses' :
                      plan.billing_period === 'semiannual' ? '6 meses' : 'año'}
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
          <div className="mt-3 bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/20 transition-all cursor-pointer">
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
              <form onSubmit={handleManualPayment} className="space-y-4">
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

