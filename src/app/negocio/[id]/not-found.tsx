import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-12 max-w-md">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Negocio no encontrado</h2>
        <p className="text-gray-300 mb-8">
          El negocio que buscas no existe o ha sido eliminado.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}


