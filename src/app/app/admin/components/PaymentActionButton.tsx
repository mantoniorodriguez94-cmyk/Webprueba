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

  /* Aprobar era verde y rechazar rojo. El par se lee solo, pero en la lista
     de pagos se repite en cada fila: dos colores saturados por fila, y el
     verde encima usado como "aprobar", que no es lo que significa en esta
     app —tailwind.config lo reserva para activo/verificado/en línea—.

     Aprobar pasa a azul, que es el color de la acción. Rechazar se queda en
     rojo: eso sí es lo que el rojo significa en todas partes, y conviene que
     el botón peligroso sea el que destaca del par. */
  const bgColor = variant === "success"
    ? "bg-blue-500 hover:bg-blue-600"
    : "bg-red-600 hover:bg-red-700"

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
          loading
            ? "bg-black/15 cursor-not-allowed opacity-50"
            : bgColor
        }`}
      >
        {loading ? "Procesando..." : label}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

