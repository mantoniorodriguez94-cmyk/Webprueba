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
 */
export default async function AdminNegociosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  const supabase = await createClient()

  const { data: negocios, error } = await supabase
    .from("businesses")
    .select("id, name, logo_url, is_premium, premium_until, created_at, is_verified")
    .order("created_at", { ascending: false })

    if (error) {
      // ✅ Esto nos mostrará el mensaje real (mensaje, código, detalles)
      console.error("🔥 ERROR DETALLADO:", JSON.stringify(error, null, 2))
    }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Negocios</h1>
        <p className="text-gray-400 text-sm">
          {negocios?.length || 0} {negocios?.length === 1 ? "negocio" : "negocios"} registrados
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
                    <p className="text-xs text-gray-400 mt-1">
                      Premium hasta: {new Date(b.premium_until).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/app/admin/negocios/${b.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-center text-sm font-medium transition-colors"
                >
                  Gestionar
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <AdminActionButton 
                    id={b.id} 
                    type="verificar" 
                    label={b.is_premium && b.premium_until && new Date(b.premium_until) > new Date() ? "✓ Premium" : "Verificar"}
                    disabled={b.is_premium && b.premium_until && new Date(b.premium_until) > new Date()}
                  />
                  <AdminActionButton id={b.id} type="suspender" label="Suspender" />
                  <AdminActionButton id={b.id} type="destacar" label="Destacar" />
                  <AdminActionButton id={b.id} type="foto_limite" label="+ Fotos" />
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
