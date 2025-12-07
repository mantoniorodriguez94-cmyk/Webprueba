"use client"

import { useState } from "react"

interface PaymentActionButtonProps {
  id: string
  action: "approve" | "reject"
  label: string
  variant?: "success" | "danger"
}

export default function PaymentActionButton({ 
  id, 
  action, 
  label, 
  variant = "success" 
}: PaymentActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payments/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error al ${action === "approve" ? "aprobar" : "rechazar"} el pago`)
      }

      // Recargar la página para ver los cambios
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      setLoading(false)
    }
  }

  const bgColor = variant === "success" 
    ? "bg-green-600 hover:bg-green-700" 
    : "bg-red-600 hover:bg-red-700"

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
          loading
            ? "bg-gray-700 cursor-not-allowed opacity-50"
            : bgColor
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

