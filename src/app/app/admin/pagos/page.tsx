import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import PagosGroupedClient from "./PagosGroupedClient"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de pagos manuales (Admin)
 * - Lista todos los pagos manuales agrupados por fecha
 * - Permite aprobar o rechazar pagos con comprobantes
 * - Grupos colapsables para mejor organización
 */
export default async function AdminPagosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  // Crear cliente de Supabase (await necesario en Next.js 15)
  const supabase = await createClient()

  const { data: pagos, error } = await supabase
    .from("manual_payment_submissions")
    .select(`
      id,
      user_id,
      business_id,
      plan_id,
      amount_usd,
      payment_method,
      reference,
      screenshot_url,
      status,
      created_at,
      admin_notes,
      businesses(name),
      premium_plans(name, billing_period, max_photos)
    `)
    .order("created_at", { ascending: false })

  // Cargar perfiles de usuarios
  const userIds = pagos ? [...new Set(pagos.map(p => p.user_id))] : []
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Pagos Manuales</h1>
        <p className="text-gray-400 text-sm">
          {pagos?.filter(p => p.status === 'pending').length || 0} pendientes • {pagos?.filter(p => p.status === 'approved').length || 0} aprobados • {pagos?.filter(p => p.status === 'rejected').length || 0} rechazados
        </p>
        <p className="text-gray-500 text-xs mt-2">
          💡 Los pagos están agrupados por fecha. Haz clic en cada grupo para expandir o minimizar.
        </p>
      </div>

      {pagos && pagos.length > 0 ? (
        <PagosGroupedClient 
          pagos={pagos as any} 
          profiles={profiles || []} 
        />
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay pagos registrados</p>
          <p className="text-sm">Los pagos aparecerán aquí cuando los usuarios envíen comprobantes.</p>
        </div>
      )}
    </div>
  )
}
