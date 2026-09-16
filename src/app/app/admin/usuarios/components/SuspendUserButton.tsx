"use client"

/**
 * Suspender o reactivar una cuenta.
 *
 * La única acción sobre una persona problemática era eliminarla: irreversible,
 * y se lleva por delante sus negocios, sus reseñas y su historial de pagos.
 * Demasiado para quien escribió una reseña abusiva o mandó spam por chat.
 *
 * Pide el motivo antes de suspender, y no por formalidad: es lo que se le
 * responde a quien reclama, y lo que queda en el registro de auditoría.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  profileId: string
  profileName: string
  suspendido: boolean
  /**
   * Botón a lo ancho en vez de pastilla. En la tabla de usuarios va inline
   * dentro de una fila y la pastilla es lo correcto; en la rejilla de
   * acciones rápidas queda al pie de una tarjeta, junto a diez botones que
   * ocupan todo el ancho, y la pastilla desalineaba la fila entera.
   */
  aLoAncho?: boolean
}

export default function SuspendUserButton({ profileId, profileName, suspendido, aLoAncho = false }: Props) {
  const forma = aLoAncho
    ? "w-full justify-center rounded-xl px-3 py-2 text-xs font-medium"
    : "rounded-full px-3 py-1.5 text-xs font-semibold"
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (suspender: boolean) => {
    if (suspender && !motivo.trim()) {
      toast.error("Escribe el motivo de la suspensión")
      return
    }
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, suspender, motivo }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo completar la acción")
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

  if (suspendido) {
    return (
      <button
        type="button"
        disabled={ocupado}
        onClick={() => enviar(false)}
        className={`inline-flex items-center border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 ${forma}`}
      >
        Reactivar
      </button>
    )
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex items-center border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 ${forma}`}
      >
        Suspender
      </button>
    )
  }

  return (
    <div className="w-56 rounded-2xl border border-black/10 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs text-ink-2">
        Suspender a <span className="font-semibold text-ink">{profileName}</span>
      </p>
      <input
        autoFocus
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={300}
        placeholder="Motivo…"
        className="w-full rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-blue-400"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => enviar(true)}
          className="flex-1 rounded-xl bg-amber-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          Confirmar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setAbierto(false)
            setMotivo("")
          }}
          className="rounded-xl border border-black/10 px-2 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
