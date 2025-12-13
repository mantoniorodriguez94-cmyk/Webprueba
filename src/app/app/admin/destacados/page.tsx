import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"
import Image from "next/image"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de negocios destacados (Admin)
 * - Lista todos los negocios actualmente destacados
 * - Muestra cuántos días les quedan activos
 */
export default async function AdminDestacadosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  const supabase = await createClient()

  // Obtener todos los negocios destacados activos
  const { data: negocios, error } = await supabase
    .from("businesses")
    .select("id, name, logo_url, is_featured, featured_until, created_at, category, description")
    .eq("is_featured", true)
    .not("featured_until", "is", null)
    .order("featured_until", { ascending: true }) // Los que expiran primero arriba

  // Función para calcular días restantes
  const getDaysRemaining = (featuredUntil: string | null): number | null => {
    if (!featuredUntil) return null
    const now = new Date()
    const expiry = new Date(featuredUntil)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Función para determinar el estado (color del badge)
  const getStatusColor = (days: number | null): string => {
    if (days === null) return "bg-gray-500/20 text-gray-300 border-gray-500/40"
    if (days <= 0) return "bg-red-500/20 text-red-300 border-red-500/40"
    if (days <= 3) return "bg-orange-500/20 text-orange-300 border-orange-500/40"
    if (days <= 7) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
    return "bg-green-500/20 text-green-300 border-green-500/40"
  }

  // Filtrar solo los que aún están activos (featured_until > NOW)
  const now = new Date()
  const negociosActivos = negocios?.filter(b => {
    if (!b.featured_until) return false
    return new Date(b.featured_until) > now
  }) || []

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Negocios Destacados</h1>
        <p className="text-gray-400 text-sm">
          {negociosActivos.length} {negociosActivos.length === 1 ? "negocio destacado" : "negocios destacados"} activos
        </p>
      </div>

      {negociosActivos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {negociosActivos.map((b) => {
            const daysRemaining = getDaysRemaining(b.featured_until)
            const statusColor = getStatusColor(daysRemaining)
            const expiryDate = b.featured_until 
              ? new Date(b.featured_until).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })
              : "Sin fecha"

            return (
              <div
                key={b.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-500 transition-all"
              >
                {/* Header con logo y nombre */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex-shrink-0 border-2 border-purple-500/40">
                    {b.logo_url ? (
                      <Image 
                        src={b.logo_url} 
                        width={64} 
                        height={64} 
                        unoptimized 
                        alt={b.name || "Negocio"} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center text-purple-400 text-3xl font-bold w-full h-full">
                        {b.name?.[0]?.toUpperCase() || "N"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold truncate">{b.name || "Sin nombre"}</h3>
                    {b.category && (
                      <p className="text-sm text-gray-400 truncate">{b.category}</p>
                    )}
                  </div>
                </div>

                {/* Badge de días restantes */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusColor}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {daysRemaining !== null ? (
                      <span>
                        {daysRemaining === 0 
                          ? "Expira hoy" 
                          : daysRemaining === 1 
                          ? "1 día restante" 
                          : `${daysRemaining} días restantes`}
                      </span>
                    ) : (
                      <span>Sin fecha de expiración</span>
                    )}
                  </div>
                </div>

                {/* Fecha de expiración */}
                <div className="mb-4 text-sm text-gray-400">
                  <p>Expira el: <span className="text-white font-medium">{expiryDate}</span></p>
                </div>

                {/* Descripción (si existe) */}
                {b.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {b.description}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <Link
                    href={`/app/admin/negocios/${b.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-center text-sm font-medium transition-colors"
                  >
                    Ver Detalles
                  </Link>
                  <Link
                    href={`/app/admin/negocios/${b.id}/gestionar`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-center text-sm font-medium transition-colors"
                  >
                    Gestionar Negocio
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-lg mb-2">No hay negocios destacados activos</p>
          <p className="text-sm">Los negocios destacados aparecerán aquí cuando un administrador los destaque usando el botón &ldquo;Destacar&rdquo; en la página de negocios.</p>
          <Link
            href="/app/admin/negocios"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
          >
            Ir a Negocios
          </Link>
        </div>
      )}
    </div>
  )
}

