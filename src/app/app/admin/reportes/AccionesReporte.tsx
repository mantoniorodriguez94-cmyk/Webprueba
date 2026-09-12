"use client"

/**
 * Acciones sobre un reporte, en la propia lista.
 *
 * Antes cada reporte enlazaba a /app/admin/reportes/[id], una ruta que no
 * existe: daba 404. O sea que se podían ver los reportes pero no cerrarlos, y
 * la cola sólo crecía.
 *
 * Van en la lista y no en una pantalla de detalle porque una cola de
 * moderación se trabaja en tanda: la mayoría de los reportes se resuelven
 * leyendo dos líneas, y obligar a entrar y volver por cada uno es lo que hace
 * que la cola no se atienda.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  reportId: string
  tipo: "business" | "review"
  /** Presente sólo en reportes de reseña: permite ocultarla desde acá. */
  reviewId?: string | null
}

export default function AccionesReporte({ reportId, tipo, reviewId }: Props) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [motivo, setMotivo] = useState("")

  const actualizar = async (estado: "resolved" | "dismissed") => {
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/reports/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, tipo, estado, notas: motivo }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo actualizar")
        return
      }
      toast.success(estado === "resolved" ? "Reporte resuelto" : "Reporte descartado")
      router.refresh()
    } catch {
      toast.error("No se pudo conectar")
    } finally {
      setOcupado(false)
    }
  }

  const ocultarResena = async () => {
    if (!reviewId) return
    if (!motivo.trim()) {
      toast.error("Escribe el motivo antes de ocultar la reseña")
      return
    }
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/reviews/toggle-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, ocultar: true, motivo }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo ocultar")
        return
      }
      // Ocultar la reseña resuelve el reporte que la denunciaba: dejarlo
      // abierto obligaría a hacer dos veces el mismo juicio.
      await fetch("/api/admin/reports/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, tipo, estado: "resolved", notas: motivo }),
      })
      toast.success("Reseña ocultada y reporte resuelto")
      router.refresh()
    } catch {
      toast.error("No se pudo conectar")
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={500}
        placeholder="Motivo o nota interna…"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blue-400"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {reviewId && (
          <button
            type="button"
            disabled={ocupado}
            onClick={ocultarResena}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            Ocultar reseña
          </button>
        )}
        <button
          type="button"
          disabled={ocupado}
          onClick={() => actualizar("resolved")}
          className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
        >
          Resolver
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => actualizar("dismissed")}
          className="rounded-full border border-black/10 bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-black/10 disabled:opacity-50"
        >
          Descartar
        </button>
      </div>
    </div>
  )
}
