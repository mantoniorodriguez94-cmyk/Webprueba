"use client"

/**
 * Anuncio a todos los usuarios (Admin)
 *
 * La notificación por perfil existía desde hace tiempo, pero era de a uno: una
 * caída del servicio o un cambio de precios había que comunicarlo usuario por
 * usuario, o no comunicarlo.
 *
 * El anuncio aparece la próxima vez que la persona entra, no como correo: es
 * el mismo mecanismo del modal que ya existía, y llega a quien realmente está
 * usando la app.
 */

import { useState } from "react"
import { toast } from "sonner"

type Destino = "todos" | "negocios" | "personas"

const DESTINOS: { valor: Destino; etiqueta: string; ayuda: string }[] = [
  { valor: "todos", etiqueta: "Todos", ayuda: "Cualquiera con cuenta" },
  { valor: "negocios", etiqueta: "Solo negocios", ayuda: "Cuentas de empresa" },
  { valor: "personas", etiqueta: "Solo personas", ayuda: "Cuentas personales" },
]

export default function AdminAnunciosPage() {
  const [mensaje, setMensaje] = useState("")
  const [destino, setDestino] = useState<Destino>("todos")
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const enviar = async (limpiar: boolean) => {
    setOcupado(true)
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje, destino, limpiar }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? "No se pudo enviar")
        return
      }
      toast.success(json.message)
      setConfirmando(false)
      if (!limpiar) setMensaje("")
    } catch {
      toast.error("No se pudo conectar")
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Anuncio general</h1>
        <p className="mt-1 text-sm text-ink-2">
          Aparece como aviso la próxima vez que la persona entra a la app.
        </p>
      </header>

      <div className="surface rounded-2xl p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Mensaje</span>
          <textarea
            value={mensaje}
            onChange={(e) => {
              setMensaje(e.target.value)
              setConfirmando(false)
            }}
            rows={5}
            maxLength={600}
            placeholder="Ej: El sábado 12 entre 2am y 4am la app estará en mantenimiento."
            className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-400"
          />
          <span className="mt-1 block text-right text-[11px] text-ink-2">
            {mensaje.length}/600
          </span>
        </label>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-ink">¿A quién?</legend>
          <div className="flex flex-wrap gap-2">
            {DESTINOS.map((d) => (
              <button
                key={d.valor}
                type="button"
                onClick={() => {
                  setDestino(d.valor)
                  setConfirmando(false)
                }}
                className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                  destino === d.valor
                    ? "border-blue-300 bg-blue-50"
                    : "border-black/10 hover:bg-black/5"
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${
                    destino === d.valor ? "text-blue-700" : "text-ink"
                  }`}
                >
                  {d.etiqueta}
                </span>
                <span className="block text-[11px] text-ink-2">{d.ayuda}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Un anuncio masivo no tiene deshacer real: quien ya lo vio, lo vio.
            Por eso va en dos pasos y no detrás de un solo clic. */}
        {!confirmando ? (
          <button
            type="button"
            disabled={!mensaje.trim() || ocupado}
            onClick={() => setConfirmando(true)}
            className="mt-5 w-full rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            Enviar anuncio
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-ink">
              Se va a mostrar a <strong>{DESTINOS.find((d) => d.valor === destino)!.etiqueta.toLowerCase()}</strong>.
              Quien ya lo haya visto no se puede deshacer.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => enviar(false)}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {ocupado ? "Enviando…" : "Sí, enviar"}
              </button>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setConfirmando(false)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-black/5"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="surface mt-4 rounded-2xl p-5">
        <h2 className="font-semibold text-ink">Retirar el anuncio activo</h2>
        <p className="mt-1 text-sm text-ink-2">
          Quita el aviso a quienes todavía no lo han visto. Útil si te
          equivocaste o si el motivo ya pasó.
        </p>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => enviar(true)}
          className="mt-3 rounded-full border border-black/10 bg-black/5 px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-black/10 disabled:opacity-50"
        >
          Retirar de {DESTINOS.find((d) => d.valor === destino)!.etiqueta.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
