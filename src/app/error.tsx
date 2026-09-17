"use client"

/**
 * Lo que se ve cuando una pantalla revienta al renderizar.
 *
 * Sin esto, un error de render dejaba la pantalla por defecto de Next: fondo
 * blanco, texto en inglés, sin marca y sin nada que pulsar. Quien lo veía
 * asumía que la app está caída y se iba.
 *
 * Lo importante acá no es el aspecto sino el botón de reintentar. Buena parte
 * de estos fallos son de una sola vez —una respuesta a medias, una conexión
 * que se cortó a mitad de carga—, y volver a montar el árbol los resuelve sin
 * que la persona tenga que recargar ni entender nada.
 *
 * El detalle técnico NO se muestra. A quien está delante no le sirve, y un
 * mensaje de error de servidor puede filtrar nombres de tablas o de rutas. Va
 * a la consola, que es donde lo va a buscar quien pueda hacer algo.
 */

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    /* Cuando haya monitoreo, este es su sitio: aquí es donde la app se entera
       de que algo se rompió delante de un usuario. Hoy sólo queda en la
       consola del navegador, así que nadie se entera salvo que esté mirando.
       `digest` es el identificador que Vercel asigna al error del servidor —
       es lo único que permite cruzar esto con sus registros. */
    console.error("[app] Error de render:", error, error.digest)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center surface rounded-3xl shadow-sm p-8 sm:p-10">
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

        <h1 className="font-display text-2xl font-bold text-ink mb-3 text-balance">
          Algo se rompió de nuestro lado
        </h1>

        <p className="text-ink-2 mb-8">
          No es culpa tuya. Muchas veces se arregla solo al reintentar.
        </p>

        <button
          type="button"
          onClick={reset}
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl transition-colors font-semibold"
        >
          Reintentar
        </button>

        <Link
          href="/app/dashboard"
          className="mt-3 block w-full px-6 py-3 rounded-2xl bg-black/5 hover:bg-black/10 text-ink font-semibold transition-colors"
        >
          Volver a los negocios
        </Link>

        {/* Si reintentar tampoco funciona, la persona necesita a alguien, no
            otro botón que repita lo mismo. */}
        <p className="text-sm text-ink-2 mt-6">
          ¿Sigue pasando?{" "}
          <Link href="/soporte" className="text-blue-600 font-semibold hover:underline">
            Escríbenos
          </Link>
        </p>
      </div>
    </main>
  )
}
