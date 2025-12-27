import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"
import AdminCreateBusinessWithCode from "@/components/admin/AdminCreateBusinessWithCode"
import { createClient as createServiceClient } from "@supabase/supabase-js"

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

  // Obtener conteo de usuarios de manera simplificada (solo para esta página)
  let usersCount = 0
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey) {
      const serviceSupabase = createServiceClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Intentar auth.admin.listUsers() primero
      try {
        const { data: authData } = await serviceSupabase.auth.admin.listUsers()
        usersCount = authData?.users?.length || 0
      } catch {
        // Fallback a profiles
        const { count } = await serviceSupabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
        usersCount = count || 0
      }
    } else {
      // Fallback final: usar cliente normal
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
      usersCount = count || 0
    }
  } catch (err) {
    console.warn("⚠️ Error contando usuarios, usando 0:", err)
    usersCount = 0
  }

  // Cargar todas las demás estadísticas en paralelo
  const [
    { count: businessesCount },
    { count: premiumCount },
    { count: pendingPaymentsCount },
    { count: expiringCount },
    { count: featuredCount }
  ] = await Promise.all([
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
    
    // NEGOCIOS DESTACADOS ACTIVOS
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true)
      .not("featured_until", "is", null)
      .gt("featured_until", new Date().toISOString()),
    
  ])

  const stats = {
    users: usersCount,
    businesses: businessesCount || 0,
    premium: premiumCount || 0,
    pendingPayments: pendingPaymentsCount || 0,
    expiring: expiringCount || 0,
    featured: featuredCount || 0,
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Administrativo</h1>
        <p className="text-gray-400 text-sm">
          Gestión centralizada del sistema
        </p>
      </div>

      {/* CREAR NEGOCIO CON CÓDIGO (SOLO ADMIN) */}
      <div className="mb-10">
        <AdminCreateBusinessWithCode />
      </div>

      {/* SECCIÓN DE MÉTRICAS */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Métricas Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminCard
            title="Usuarios Registrados"
            value={stats.users}
            iconBg="bg-blue-500/20"
            href="/app/admin/usuarios"
          />
          <AdminCard
            title="Negocios"
            value={stats.businesses}
            iconBg="bg-green-500/20"
            href="/app/admin/negocios"
          />
          <AdminCard
            title="Negocios Premium"
            value={stats.premium}
            iconBg="bg-yellow-500/20"
            href="/app/admin/negocios?filter=premium"
          />
          <AdminCard
            title="Pagos Pendientes"
            value={stats.pendingPayments}
            iconBg="bg-orange-500/20"
            href="/app/admin/pagos"
          />
          <AdminCard
            title="Suscripciones por Expirar"
            value={stats.expiring}
            iconBg="bg-red-500/20"
            href="/app/admin/pagos"
          />
          <AdminCard
            title="Negocios Destacados"
            value={stats.featured}
            iconBg="bg-purple-500/20"
            href="/app/admin/destacados"
          />
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
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
