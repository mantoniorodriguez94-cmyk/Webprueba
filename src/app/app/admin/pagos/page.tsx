import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image"
import PaymentActionButton from "../components/PaymentActionButton"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de pagos manuales pendientes (Admin)
 * - Lista todos los pagos manuales que esperan aprobación
 * - Permite aprobar o rechazar pagos con comprobantes
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

  // Error silenciosamente manejado - los pagos pueden estar vacíos si hay error

  // Cargar perfiles de usuarios de una vez
  const userIds = pagos ? [...new Set(pagos.map(p => p.user_id))] : []
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  // Crear mapa de user_id -> profile para acceso rápido
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Pagos Manuales</h1>
        <p className="text-gray-400 text-sm">
          {pagos?.filter(p => p.status === 'pending').length || 0} pendientes • {pagos?.filter(p => p.status === 'approved').length || 0} aprobados • {pagos?.filter(p => p.status === 'rejected').length || 0} rechazados
        </p>
      </div>

      {pagos && pagos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagos.map((pago) => {
            const business = Array.isArray(pago.businesses) ? pago.businesses[0] : pago.businesses
            const plan = Array.isArray(pago.premium_plans) ? pago.premium_plans[0] : pago.premium_plans
            const profile = profilesMap.get(pago.user_id)

            const statusColors = {
              pending: "border-yellow-500/40 bg-yellow-500/10",
              approved: "border-green-500/40 bg-green-500/10",
              rejected: "border-red-500/40 bg-red-500/10"
            }

            const statusLabels = {
              pending: "Pendiente",
              approved: "Aprobado",
              rejected: "Rechazado"
            }

            return (
              <div
                key={pago.id}
                className={`bg-white/10 backdrop-blur-md p-6 rounded-2xl border-2 ${statusColors[pago.status as keyof typeof statusColors] || "border-white/20"} hover:border-blue-500 transition-all`}
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-1">
                        {business?.name || "Negocio desconocido"}
                      </h2>
                      <p className="text-gray-300 text-sm mb-1">
                        Plan: {plan?.name || "N/A"} {plan?.max_photos && `(${plan.max_photos} fotos máx.)`}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        Usuario: {profile?.full_name || profile?.email || pago.user_id.substring(0, 8)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pago.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      pago.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {statusLabels[pago.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
                    <span>💰 Monto: ${pago.amount_usd || "0"} USD</span>
                    <span>•</span>
                    <span>💳 Método: {pago.payment_method || "N/A"}</span>
                    {pago.reference && (
                      <>
                        <span>•</span>
                        <span>🔖 Ref: {pago.reference}</span>
                      </>
                    )}
                  </div>
                  {pago.created_at && (
                    <p className="text-xs text-gray-500">
                      📅 Enviado: {new Date(pago.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  )}
                  {pago.admin_notes && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300 font-semibold mb-1">📝 Notas del Admin:</p>
                      <p className="text-xs text-blue-200">{pago.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Screenshot */}
                {pago.screenshot_url && (
                  <div className="mt-4 mb-4">
                    <p className="text-xs text-gray-400 mb-2">Comprobante de pago:</p>
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <Image
                        src={pago.screenshot_url}
                        width={400}
                        height={400}
                        alt="Comprobante de pago"
                        className="w-full h-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* BOTONES - Solo mostrar si está pendiente */}
                {pago.status === 'pending' && (
                  <div className="flex gap-3 mt-5">
                    <PaymentActionButton 
                      id={pago.id} 
                      action="approve" 
                      label="Aprobar" 
                      variant="success"
                    />
                    <PaymentActionButton 
                      id={pago.id} 
                      action="reject" 
                      label="Rechazar" 
                      variant="danger"
                    />
                  </div>
                )}
                {pago.status !== 'pending' && (
                  <div className="mt-4 text-xs text-gray-400">
                    Este pago ya fue procesado ({pago.status === 'approved' ? 'aprobado' : 'rechazado'})
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay pagos pendientes</p>
          <p className="text-sm">Todos los pagos han sido procesados.</p>
        </div>
      )}
    </div>
  )
}
