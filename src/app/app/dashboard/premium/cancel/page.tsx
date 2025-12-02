"use client"

/**
 * Página de Cancelación de Pago PayPal
 * El usuario es redirigido aquí si cancela el pago en PayPal
 */

import { useRouter } from "next/navigation"

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Pago Cancelado</h1>
        
        <p className="text-gray-400 mb-6">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Intentar de Nuevo
          </button>
          
          <button
            onClick={() => router.push('/app/dashboard')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}


