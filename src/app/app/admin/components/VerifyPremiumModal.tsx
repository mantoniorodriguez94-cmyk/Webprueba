"use client"

import { useState } from "react"

interface VerifyPremiumModalProps {
  businessId: string
  businessName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: any) => void
}

const PREMIUM_OPTIONS = [
  { days: 30, label: "1 mes", months: 1 },
  { days: 90, label: "3 meses", months: 3 },
  { days: 180, label: "6 meses", months: 6 },
  { days: 365, label: "1 año", months: 12 }
]

export default function VerifyPremiumModal({
  businessId,
  businessName,
  isOpen,
  onClose,
  onSuccess
}: VerifyPremiumModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleVerify() {
    if (!selectedDays) {
      setError("Por favor selecciona una duración")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/business/verificar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessId,
          durationDays: selectedDays
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al activar premium")
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
            Activar Premium
          </h2>
          <p className="text-sm text-gray-400 mb-1">
            Negocio: <span className="text-white font-medium">{businessName}</span>
          </p>
          <p className="text-sm text-gray-400">
            Selecciona la duración del plan premium que deseas otorgar
          </p>
        </div>

        {/* Opciones de duración */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {PREMIUM_OPTIONS.map((option) => (
            <button
              key={option.days}
              onClick={() => {
                setSelectedDays(option.days)
                setError(null)
              }}
              disabled={loading}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedDays === option.days
                  ? "bg-blue-600 text-white border-2 border-blue-400"
                  : "bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-gray-600"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
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
            onClick={handleVerify}
            disabled={loading || !selectedDays}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Activando..." : "Activar Premium"}
          </button>
        </div>
      </div>
    </div>
  )
}


