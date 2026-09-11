import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center surface rounded-3xl shadow-sm p-12 max-w-md">
        <h1 className="text-6xl font-bold text-ink mb-4">404</h1>
        <h2 className="text-2xl font-bold text-ink mb-4">Negocio no encontrado</h2>
        <p className="text-ink-2 mb-8">
          El negocio que buscas no existe o ha sido eliminado.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}


