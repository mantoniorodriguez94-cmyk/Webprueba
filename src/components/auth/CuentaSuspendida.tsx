"use client"

/**
 * Lo que ve alguien con la cuenta suspendida.
 *
 * Sin esta pantalla, suspender daba una app rota: los botones seguían ahí, se
 * podían pulsar, y fallaban sin explicación —o peor, en silencio—. Quien no
 * sabe que está suspendido cree que la app no funciona y escribe a soporte
 * para reportar un fallo que no existe.
 *
 * Se le dice qué pasó, por qué, y por dónde reclamar. El enlace a soporte es
 * deliberado y las políticas de la base lo respetan: escribir a soporte es lo
 * único que una cuenta suspendida sigue pudiendo hacer, porque cerrarle
 * también esa puerta convierte una suspensión discutible en definitiva.
 */

import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface Props {
  motivo?: string | null
  desde?: string | null
}

export default function CuentaSuspendida({ motivo, desde }: Props) {
  const fecha = desde
    ? new Date(desde).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md surface-elevated rounded-3xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 className="font-display text-2xl font-bold text-ink mb-3">
          Tu cuenta está suspendida
        </h2>

        <p className="text-ink-2 mb-6">
          Puedes seguir entrando y mirando el directorio, pero por ahora no
          puedes publicar reseñas, enviar mensajes ni gestionar negocios.
        </p>

        {motivo && (
          <div className="text-left rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
            <p className="text-xs font-semibold text-amber-800 mb-1">Motivo</p>
            <p className="text-sm text-ink whitespace-pre-line">{motivo}</p>
            {fecha && (
              <p className="text-xs text-ink-2 mt-2">Suspendida el {fecha}</p>
            )}
          </div>
        )}

        <Link
          href="/soporte"
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl transition-colors font-semibold"
        >
          Escribir a soporte
        </Link>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = "/"
          }}
          className="mt-3 w-full px-6 py-3 rounded-2xl bg-black/5 hover:bg-black/10 text-ink font-semibold transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
