"use client"

import { useState } from "react"

interface FeaturedDaysModalProps {
  businessId: string
  businessName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: any) => void
}

export default function FeaturedDaysModal({
  businessId,
  businessName,
  isOpen,
  onClose,
  onSuccess
}: FeaturedDaysModalProps) {
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleFeature() {
    const daysNumber = parseInt(days, 10)

    if (isNaN(daysNumber) || daysNumber <= 0) {
      setError("Por favor ingresa un número válido mayor a 0")
      return
    }

    if (daysNumber > 365) {
      setError("El número de días no puede exceder 365")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/business/destacar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessId,
          days: daysNumber
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al destacar el negocio")
      }

      // Llamar al callback onSuccess
      if (onSuccess) {
        onSuccess(data.data)
      }

      // Cerrar modal
      onClose()
      
      // Recargar la página para ver los cambios
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-white mb-2">
            Destacar Negocio
          </h2>
          <p className="text-sm text-gray-400 mb-1">
            Negocio: <span className="text-white font-medium">{businessName}</span>
          </p>
          <p className="text-sm text-gray-400">
            El negocio aparecerá en la sección de destacados por el tiempo especificado
          </p>
        </div>

        {/* Input para días */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Número de días
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => {
              setDays(e.target.value)
              setError(null)
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ingresa el número de días (1-365)"
          />
          <p className="text-xs text-gray-500 mt-2">
            El negocio estará destacado por {days || "0"} {days === "1" ? "día" : "días"}
          </p>
          {days && parseInt(days, 10) > 0 && (
            <p className="text-xs text-blue-400 mt-1">
              Destacado hasta: {new Date(Date.now() + parseInt(days, 10) * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleFeature}
            disabled={loading || !days || parseInt(days, 10) <= 0}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Destacando..." : "Destacar Negocio"}
          </button>
        </div>
      </div>
    </div>
  )
}

