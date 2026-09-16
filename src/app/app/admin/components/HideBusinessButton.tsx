"use client"

/**
 * Ocultar o restaurar un negocio del directorio.
 *
 * El punto medio entre no hacer nada y "Eliminar", que es irreversible y se
 * lleva reseñas, chat, fotos e historial de pagos.
 *
 * Pide el motivo antes de ocultar, y no como formalidad: es lo que se le
 * muestra al dueño en su pantalla de gestión, lo que se le responde cuando
 * escriba preguntando, y lo que queda en auditoría.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  businessId: string
  businessName: string
  oculto: boolean
}

export default function HideBusinessButton({ businessId, businessName, oculto }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (ocultar: boolean) => {
    if (ocultar && !motivo.trim()) {
      toast.error("Escribe el motivo. El dueño lo verá en su pantalla.")
      return
    }
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/business/toggle-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ocultar, motivo }),
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

  if (oculto) {
    return (
      <button
        type="button"
        disabled={ocupado}
        onClick={() => enviar(false)}
        className="w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
      >
        {ocupado ? "..." : "Volver a mostrar"}
      </button>
    )
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
      >
        Ocultar del directorio
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
      <p className="mb-2 text-[11px] text-ink-2">
        <span className="font-semibold text-ink">{businessName}</span> dejará de
        aparecer en el directorio. Su dueño lo seguirá viendo, con el motivo.
      </p>
      <input
        autoFocus
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={300}
        placeholder="Motivo (estafa, cerrado, contenido…)"
        className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-amber-400"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => enviar(true)}
          className="flex-1 rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {ocupado ? "..." : "Ocultar"}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setAbierto(false)
            setMotivo("")
          }}
          className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
