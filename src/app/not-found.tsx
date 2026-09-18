import Link from "next/link"

/**
 * La pantalla de 404 de toda la app.
 *
 * No existía: cualquier URL equivocada caía en la pantalla por defecto de
 * Next, que está en inglés, no tiene marca y no ofrece a dónde ir. La de las
 * fichas de negocio (`negocio/[id]/not-found.tsx`) sí existía, pero sólo cubre
 * esa ruta — el resto del sitio no tenía nada.
 *
 * Ofrece salida y no sólo disculpa: quien llega aquí casi siempre venía a
 * buscar un negocio, así que el botón principal lleva al directorio.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center surface rounded-3xl shadow-sm p-8 sm:p-10">
        <p className="font-display text-6xl font-bold text-ink mb-3">404</p>

        <h1 className="font-display text-2xl font-bold text-ink mb-3 text-balance">
          Esta página no existe
        </h1>

        <p className="text-ink-2 mb-8">
          Puede que el enlace esté mal escrito, o que lo que buscabas ya no esté
          publicado.
        </p>

        <Link
          href="/app/dashboard"
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl transition-colors font-semibold"
        >
          Ver negocios
        </Link>

        <Link
          href="/"
          className="mt-3 block w-full px-6 py-3 rounded-2xl bg-black/5 hover:bg-black/10 text-ink font-semibold transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
