"use client"

/**
 * Botones de estado de un mensaje de soporte.
 *
 * Cliente porque la página es un server component: la lista se arma en el
 * servidor (la tabla no es legible desde el navegador por RLS) y sólo las
 * acciones necesitan interactividad.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Estado = "pending" | "in_progress" | "resolved"

const SIGUIENTE: { estado: Estado; etiqueta: string; clase: string }[] = [
  { estado: "in_progress", etiqueta: "En curso", clase: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { estado: "resolved", etiqueta: "Resuelto", clase: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { estado: "pending", etiqueta: "Reabrir", clase: "bg-black/5 text-ink-2 border-black/10 hover:bg-black/10" },
]

export default function AccionesMensaje({
  messageId,
  estadoActual,
  notasActuales,
}: {
  messageId: string
  estadoActual: Estado
  notasActuales: string | null
}) {
  const router = useRouter()
  const [notas, setNotas] = useState(notasActuales ?? "")
  const [guardando, setGuardando] = useState(false)

  const cambiar = async (estado: Estado) => {
    setGuardando(true)
    try {
      const res = await fetch("/api/admin/support/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, estado, notas }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo actualizar")
        return
      }
      toast.success(json.message)
      // La lista vive en el servidor: hay que pedirla de nuevo para ver el
      // estado nuevo.
      router.refresh()
    } catch {
      toast.error("No se pudo conectar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Nota interna (qué se hizo, qué falta)…"
        className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blue-400"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {SIGUIENTE.filter((s) => s.estado !== estadoActual).map((s) => (
          <button
            key={s.estado}
            type="button"
            disabled={guardando}
            onClick={() => cambiar(s.estado)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${s.clase}`}
          >
            {s.etiqueta}
          </button>
        ))}
      </div>
    </div>
  )
}
