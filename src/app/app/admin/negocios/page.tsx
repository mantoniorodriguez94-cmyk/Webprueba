import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"
import AdminBusinessListClient from "../components/AdminBusinessListClient"

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

  const baseSelect =
    "id, name, logo_url, is_premium, premium_until, created_at, is_verified, max_photos, owner_id, is_featured, featured_until"
  const extendedSelect =
    baseSelect +
    ", has_gold_border, search_priority_boost, chat_enabled, badges"

  const buildQuery = (select: string) => {
    let q = supabase.from("businesses").select(select)

    if (filter === "premium") {
      q = q
        .eq("is_premium", true)
        .not("premium_until", "is", null)
        .gte("premium_until", new Date().toISOString())
    } else if (filter === "expiring") {
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000)

      q = q
        .eq("is_premium", true)
        .not("premium_until", "is", null)
        .gte("premium_until", now.toISOString())
        .lte("premium_until", thirtyDaysFromNow.toISOString())
    }

    return q
      .order("premium_until", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
  }

  let negocios: any[] | null = null

  // Intentar primero con columnas extendidas; si fallan (por columnas faltantes), hacer fallback
  try {
    const { data, error } = await buildQuery(extendedSelect)
    if (error) throw error
    negocios = data ?? []
  } catch (err: any) {
    console.error("[admin/negocios] Error cargando negocios (extended):", err?.message || err)
    const { data, error: fallbackError } = await buildQuery(baseSelect)
    if (fallbackError) {
      console.error("[admin/negocios] Error cargando negocios (fallback):", fallbackError?.message || fallbackError)
      negocios = []
    } else {
      negocios = data ?? []
    }
  }

  // Calcular días restantes para negocios premium
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
        <AdminBusinessListClient
          businesses={negocios.map((b) => ({
            id: b.id,
            name: b.name,
            logo_url: b.logo_url,
            is_premium: !!b.is_premium,
            premium_until: b.premium_until,
            created_at: b.created_at,
            is_verified: b.is_verified,
            max_photos: b.max_photos,
            owner_id: b.owner_id,
            is_featured: b.is_featured,
            featured_until: b.featured_until,
            has_gold_border: (b as any).has_gold_border ?? false,
            search_priority_boost: (b as any).search_priority_boost ?? false,
            chat_enabled: (b as any).chat_enabled ?? false,
            badges: (b as any).badges ?? [],
          }))}
        />
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay negocios registrados</p>
          <p className="text-sm">Los negocios aparecerán aquí cuando se registren en el sistema.</p>
        </div>
      )}
    </div>
  )
}
