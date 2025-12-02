"use client"

/**
 * Página de Éxito de Pago PayPal
 * El usuario es redirigido aquí después de completar el pago en PayPal
 */

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    capturePayment()
  }, [])

  const capturePayment = async () => {
    try {
      // Obtener el token (order ID) de PayPal de la URL
      const token = searchParams.get('token')
      
      // Obtener paymentId de sessionStorage (lo guardamos antes de redirigir)
      const paymentId = sessionStorage.getItem('pending_payment_id')
      const orderId = sessionStorage.getItem('pending_order_id')

      if (!token || !paymentId) {
        setError('Información de pago no encontrada')
        setProcessing(false)
        return
      }

      // Verificar que el token coincide con el orderId guardado
      if (token !== orderId) {
        setError('ID de orden no coincide')
        setProcessing(false)
        return
      }

      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      // Capturar el pago
      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          orderId: token,
          paymentId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error capturando pago')
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('pending_payment_id')
      sessionStorage.removeItem('pending_order_id')

      setSuccess(true)
      setProcessing(false)

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        router.push('/app/dashboard')
      }, 3000)

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error procesando el pago')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        {processing && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">Procesando tu pago...</h1>
            <p className="text-gray-400">Por favor espera un momento</p>
          </>
        )}

        {success && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-400 mb-4">
              Tu suscripción premium ha sido activada correctamente
            </p>
            <p className="text-gray-500 text-sm">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Error en el Pago</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/app/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

