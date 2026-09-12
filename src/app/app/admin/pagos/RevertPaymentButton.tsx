"use client"

/**
 * Revertir un pago ya aprobado.
 *
 * Sólo existían aprobar y rechazar: una vez aprobado no había vuelta atrás.
 * Un comprobante falso detectado tarde, un monto mal leído o un reembolso
 * dejaban la membresía activa sin ninguna forma de deshacerla desde el panel.
 *
 * Pide confirmación explícita con motivo porque toca dinero y vigencia: la
 * acción resta del vencimiento los mismos meses que sumó la aprobación.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RevertPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [ocupado, setOcupado] = useState(false)

  const revertir = async () => {
    if (!motivo.trim()) {
      toast.error("Escribe el motivo de la reversión")
      return
    }
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/payments/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, motivo }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo revertir")
        return
      }
      toast.success(json.message)
      setAbierto(false)
      setMotivo("")
      router.refresh()
    } catch {
      toast.error("No se pudo conectar")
    } finally {
      setOcupado(false)
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-3 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
      >
        Revertir aprobación
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/60 p-3">
      <p className="mb-2 text-xs text-ink-2">
        Se restarán del vencimiento los mismos meses que sumó esta aprobación. Si
        el resultado queda en el pasado, la membresía baja a nivel 0.
      </p>
      <input
        autoFocus
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={300}
        placeholder="Motivo (comprobante falso, reembolso, error…)"
        className="w-full rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-red-400"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={revertir}
          className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {ocupado ? "Revirtiendo…" : "Confirmar reversión"}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setAbierto(false)
            setMotivo("")
          }}
          className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
