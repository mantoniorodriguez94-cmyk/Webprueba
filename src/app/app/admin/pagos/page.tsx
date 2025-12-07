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
      premium_plans(name, billing_period)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error cargando pagos:", error)
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pagos Manuales Pendientes</h1>
        <p className="text-gray-400 text-sm">
          {pagos?.length || 0} {pagos?.length === 1 ? "pago pendiente" : "pagos pendientes"} de revisión
        </p>
      </div>

      {pagos && pagos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagos.map((pago) => {
            const business = Array.isArray(pago.businesses) ? pago.businesses[0] : pago.businesses
            const plan = Array.isArray(pago.premium_plans) ? pago.premium_plans[0] : pago.premium_plans

            return (
              <div
                key={pago.id}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:border-blue-500 transition-all"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-1">
                    {business?.name || "Negocio desconocido"}
                  </h2>
                  <p className="text-gray-300 text-sm mb-2">
                    Plan: {plan?.name || "N/A"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>Monto: ${pago.amount_usd || "0"} USD</span>
                    <span>•</span>
                    <span>Método: {pago.payment_method || "N/A"}</span>
                    {pago.reference && (
                      <>
                        <span>•</span>
                        <span>Ref: {pago.reference}</span>
                      </>
                    )}
                  </div>
                  {pago.created_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Enviado: {new Date(pago.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
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

                {/* BOTONES */}
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
