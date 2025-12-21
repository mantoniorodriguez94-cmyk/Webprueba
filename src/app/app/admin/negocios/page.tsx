import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"
import Image from "next/image"
import AdminActionButton from "../components/AdminActionButton"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de gestión de negocios (Admin)
 * - Lista todos los negocios del sistema
 * - Permite acciones administrativas sobre cada negocio
 * - Soporta filtros: ?filter=premium, ?filter=expiring
 */
export default async function AdminNegociosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  const supabase = await createClient()
  const params = await searchParams
  const filter = params?.filter

  // Construir query según el filtro
  let query = supabase
    .from("businesses")
    .select("id, name, logo_url, is_premium, premium_until, created_at, is_verified, max_photos")

  // Aplicar filtros
  if (filter === 'premium') {
    query = query.eq("is_premium", true)
      .not("premium_until", "is", null)
      .gte("premium_until", new Date().toISOString()) // Aún no expirado
  } else if (filter === 'expiring') {
    // Negocios premium que expiran en 30 días o menos
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000)
    
    query = query
      .eq("is_premium", true)
      .not("premium_until", "is", null)
      .gte("premium_until", now.toISOString()) // Aún no expirado
      .lte("premium_until", thirtyDaysFromNow.toISOString()) // Expira en 30 días o menos
  }

  const { data: negocios, error } = await query.order("premium_until", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

    // Error silenciosamente manejado - los negocios pueden estar vacíos si hay error

  // Calcular días restantes para negocios premium
  const getDaysUntilExpiry = (premiumUntil: string | null) => {
    if (!premiumUntil) return null
    const expiry = new Date(premiumUntil)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">
            {filter === 'expiring' 
              ? 'Suscripciones por Expirar' 
              : filter === 'premium'
              ? 'Negocios Premium'
              : 'Gestión de Negocios'}
          </h1>
          {filter && (
            <Link
              href="/app/admin/negocios"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos →
            </Link>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          {filter === 'expiring' 
            ? `${negocios?.length || 0} ${negocios?.length === 1 ? "negocio" : "negocios"} con suscripción expirando en 30 días o menos`
            : filter === 'premium'
            ? `${negocios?.length || 0} ${negocios?.length === 1 ? "negocio" : "negocios"} premium activos`
            : `${negocios?.length || 0} ${negocios?.length === 1 ? "negocio" : "negocios"} registrados`}
        </p>
      </div>

      {negocios && negocios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {negocios.map((b) => (
            <div
              key={b.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-500 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
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
                    <div className="flex items-center justify-center text-blue-400 text-3xl font-bold w-full h-full">
                      {b.name?.[0]?.toUpperCase() || "N"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold truncate">{b.name || "Sin nombre"}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {b.is_premium && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                        Premium
                      </span>
                    )}
                    {b.is_verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                        Verificado
                      </span>
                    )}
                  </div>
                  {b.premium_until && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-400">
                        Premium hasta: {new Date(b.premium_until).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      {(() => {
                        const daysLeft = getDaysUntilExpiry(b.premium_until)
                        if (daysLeft !== null) {
                          const isExpiringSoon = daysLeft <= 30
                          return (
                            <p className={`text-xs font-semibold ${
                              daysLeft <= 7 
                                ? 'text-red-400' 
                                : daysLeft <= 30 
                                ? 'text-yellow-400' 
                                : 'text-green-400'
                            }`}>
                              {daysLeft === 0 
                                ? '⚠️ Expira hoy' 
                                : daysLeft === 1
                                ? '⚠️ Expira mañana'
                                : isExpiringSoon
                                ? `⚠️ ${daysLeft} días restantes`
                                : `${daysLeft} días restantes`}
                            </p>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/app/admin/negocios/${b.id}/gestionar`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-center text-sm font-medium transition-colors"
                >
                  Gestionar
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <AdminActionButton 
                    id={b.id} 
                    type="verificar" 
                    label={b.is_premium ? "✓ Premium" : "Activar Premium"}
                    disabled={b.is_premium}
                    businessName={b.name || "Negocio"}
                  />
                  <AdminActionButton 
                    id={b.id} 
                    type="suspender" 
                    label="Suspender Premium"
                    disabled={!b.is_premium}
                  />
                  <AdminActionButton id={b.id} type="destacar" label="Destacar" />
                  <AdminActionButton 
                    id={b.id} 
                    type="foto_limite" 
                    label={`+ Fotos (${b.max_photos || 5})`}
                    currentMaxPhotos={b.max_photos || 5}
                    businessName={b.name || "Negocio"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay negocios registrados</p>
          <p className="text-sm">Los negocios aparecerán aquí cuando se registren en el sistema.</p>
        </div>
      )}
    </div>
  )
}
