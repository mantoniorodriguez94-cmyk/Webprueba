"use client"

import { useState } from "react"

interface UpdatePhotosLimitModalProps {
  businessId: string
  businessName: string
  currentLimit: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: any) => void
}

export default function UpdatePhotosLimitModal({
  businessId,
  businessName,
  currentLimit,
  isOpen,
  onClose,
  onSuccess
}: UpdatePhotosLimitModalProps) {
  const [loading, setLoading] = useState(false)
  const [newLimit, setNewLimit] = useState<string>(currentLimit.toString())
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleUpdate() {
    const limitNumber = parseInt(newLimit, 10)

    if (isNaN(limitNumber) || limitNumber < 0) {
      setError("Por favor ingresa un número válido mayor o igual a 0")
      return
    }

    if (limitNumber === currentLimit) {
      setError("El nuevo límite debe ser diferente al actual")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/business/foto_limite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessId,
          maxPhotos: limitNumber
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el límite de fotos")
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
            Modificar Límite de Fotos
          </h2>
          <p className="text-sm text-gray-400 mb-1">
            Negocio: <span className="text-white font-medium">{businessName}</span>
          </p>
          <p className="text-sm text-gray-400">
            Límite actual: <span className="text-yellow-400 font-bold">{currentLimit} fotos</span>
          </p>
        </div>

        {/* Input para nuevo límite */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Nuevo límite de fotos
          </label>
          <input
            type="number"
            min="0"
            value={newLimit}
            onChange={(e) => {
              setNewLimit(e.target.value)
              setError(null)
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ingresa el nuevo límite"
          />
          <p className="text-xs text-gray-500 mt-2">
            El negocio podrá subir hasta {newLimit || "0"} fotos en su galería
          </p>
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
            onClick={handleUpdate}
            disabled={loading || !newLimit || parseInt(newLimit, 10) === currentLimit}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Actualizando..." : "Actualizar Límite"}
          </button>
        </div>
      </div>
    </div>
  )
}

