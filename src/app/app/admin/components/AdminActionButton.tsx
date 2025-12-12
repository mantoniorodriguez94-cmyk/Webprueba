"use client"

import { useState } from "react"

interface AdminActionButtonProps {
  id: string
  type: "verificar" | "suspender" | "destacar" | "foto_limite"
  label: string
  disabled?: boolean
}

export default function AdminActionButton({ id, type, label, disabled = false }: AdminActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (loading || disabled) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/business/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la acción")
      }

      // Mostrar mensaje de éxito si existe
      if (data.message) {
        // Opcional: mostrar toast/notificación
        console.log("✅", data.message)
      }

      // Recargar la página para ver los cambios
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className={`px-4 py-2 rounded-xl text-sm transition-colors ${
          loading || disabled
            ? "bg-gray-700 cursor-not-allowed opacity-50"
            : "bg-gray-800 hover:bg-gray-700"
        }`}
      >
        {loading ? "Procesando..." : label}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

