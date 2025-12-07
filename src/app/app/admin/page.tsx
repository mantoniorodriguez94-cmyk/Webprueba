import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"
import Image from "next/image"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Dashboard principal del panel administrativo
 * - Carga datos reales desde Supabase usando SSR
 * - Muestra métricas y estadísticas en tiempo real
 */
export default async function AdminDashboardPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  const supabase = await createClient()

  // Cargar todas las estadísticas en paralelo para mejor rendimiento
  const [
    { count: usersCount },
    { count: businessesCount },
    { count: premiumCount },
    { count: pendingPaymentsCount },
    { count: expiringCount },
    { data: recentBusinesses }
  ] = await Promise.all([
    // TOTAL DE USUARIOS
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    
    // TOTAL DE NEGOCIOS
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true }),
    
    // NEGOCIOS PREMIUM
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true),
    
    // PAGOS MANUALES PENDIENTES
    supabase
      .from("manual_payment_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    
    // SUSCRIPCIONES POR EXPIRAR (7 días)
    supabase
      .from("business_subscriptions")
      .select("*", { count: "exact", head: true })
      .lte("end_date", new Date(Date.now() + 7 * 86400000).toISOString())
      .eq("status", "active"),
    
    // ÚLTIMOS NEGOCIOS CREADOS
    supabase
      .from("businesses")
      .select("id, name, logo_url, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
  ])

  const stats = {
    users: usersCount || 0,
    businesses: businessesCount || 0,
    premiumBusinesses: premiumCount || 0,
    pendingPayments: pendingPaymentsCount || 0,
    expiringSoon: expiringCount || 0,
  }

  return (
    <div className="min-h-screen pb-12 text-white">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Administrativo</h1>
        <p className="text-gray-400 text-sm">Gestión y estadísticas del sistema</p>
      </div>

      {/* SECCIÓN DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <AdminCard
          title="Usuarios Registrados"
          value={stats.users}
          iconBg="from-blue-400 to-blue-600"
          href="/app/admin/usuarios"
        />

        <AdminCard
          title="Negocios Registrados"
          value={stats.businesses}
          iconBg="from-green-400 to-green-600"
          href="/app/admin/negocios"
        />

        <AdminCard
          title="Premium Activos"
          value={stats.premiumBusinesses}
          iconBg="from-yellow-400 to-yellow-600"
          href="/app/admin/negocios?filter=premium"
        />

        <AdminCard
          title="Pagos Pendientes"
          value={stats.pendingPayments}
          iconBg="from-red-400 to-red-600"
          href="/app/admin/pagos"
        />

        <AdminCard
          title="Suscripciones por expirar"
          value={stats.expiringSoon}
          iconBg="from-purple-400 to-purple-600"
          href="/app/admin/negocios?filter=expiring"
        />
      </div>

      {/* ÚLTIMOS NEGOCIOS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Últimos negocios creados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentBusinesses && recentBusinesses.length > 0 ? (
            recentBusinesses.map((b) => (
              <Link
                href={`/app/admin/negocios/${b.id}`}
                key={b.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-700 overflow-hidden flex-shrink-0">
                    {b.logo_url ? (
                      <Image 
                        src={b.logo_url} 
                        width={64} 
                        height={64} 
                        className="object-cover w-full h-full" 
                        alt={b.name || "Negocio"} 
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-3xl">
                        {b.name?.[0]?.toUpperCase() || "N"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{b.name || "Sin nombre"}</p>
                    <p className="text-xs text-gray-400">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "Fecha desconocida"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              No hay negocios registrados aún
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminCard({ 
  title, 
  value, 
  iconBg, 
  href 
}: { 
  title: string
  value: number
  iconBg: string
  href: string 
}) {
  return (
    <Link
      href={href}
      className="bg-transparent backdrop-blur-lg rounded-3xl shadow-xl border-2 border-white/10 p-6 hover:shadow-2xl hover:border-blue-500 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold truncate">{title}</h3>
          <p className="text-3xl font-extrabold">{value.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  )
}
