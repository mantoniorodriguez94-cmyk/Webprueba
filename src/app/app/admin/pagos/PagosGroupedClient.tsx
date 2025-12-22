"use client"

import { useState } from "react"
import PaymentActionButton from "../components/PaymentActionButton"
import PaymentReceiptImage from "../components/PaymentReceiptImage"

interface Business {
  name: string
}

interface Plan {
  name: string
  billing_period?: string
  max_photos?: number
}

interface Profile {
  id: string
  email?: string
  full_name?: string
}

interface Pago {
  id: string
  user_id: string
  business_id: string
  plan_id: string
  amount_usd: number
  payment_method: string
  reference?: string
  screenshot_url?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  admin_notes?: string
  businesses?: Business | Business[]
  premium_plans?: Plan | Plan[]
}

interface PagosGroupedClientProps {
  pagos: Pago[]
  profiles: Profile[]
}

export default function PagosGroupedClient({ pagos, profiles }: PagosGroupedClientProps) {
  // Crear mapa de usuarios
  const profilesMap = new Map(profiles.map(p => [p.id, p]))

  // Agrupar pagos por fecha (día)
  const pagosPorFecha = pagos.reduce((grupos, pago) => {
    if (!pago.created_at) return grupos
    
    const fecha = new Date(pago.created_at)
    const fechaKey = fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    
    if (!grupos[fechaKey]) {
      grupos[fechaKey] = {
        fecha: fecha,
        fechaDisplay: fechaKey,
        pagos: []
      }
    }
    
    grupos[fechaKey].pagos.push(pago)
    return grupos
  }, {} as Record<string, { fecha: Date, fechaDisplay: string, pagos: Pago[] }>)

  // Convertir a array y ordenar por fecha descendente
  const gruposFecha = Object.values(pagosPorFecha).sort((a, b) => 
    b.fecha.getTime() - a.fecha.getTime()
  )

  // Estado para controlar qué grupos están expandidos
  const [gruposExpandidos, setGruposExpandidos] = useState<Record<string, boolean>>(
    // Por defecto, todos expandidos
    gruposFecha.reduce((acc, grupo) => {
      acc[grupo.fechaDisplay] = true
      return acc
    }, {} as Record<string, boolean>)
  )

  const toggleGrupo = (fechaKey: string) => {
    setGruposExpandidos(prev => ({
      ...prev,
      [fechaKey]: !prev[fechaKey]
    }))
  }

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
    <div className="space-y-6">
      {gruposFecha.map((grupo) => {
        const isExpanded = gruposExpandidos[grupo.fechaDisplay]
        const pendingCount = grupo.pagos.filter(p => p.status === 'pending').length
        const approvedCount = grupo.pagos.filter(p => p.status === 'approved').length
        const rejectedCount = grupo.pagos.filter(p => p.status === 'rejected').length

        return (
          <div key={grupo.fechaDisplay} className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
            {/* Header del grupo - Clickeable para expandir/colapsar */}
            <button
              onClick={() => toggleGrupo(grupo.fechaDisplay)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Icono de expandir/colapsar */}
                <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Fecha */}
                <div className="text-left">
                  <h2 className="text-xl font-bold text-white">
                    📅 {grupo.fechaDisplay}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {grupo.pagos.length} {grupo.pagos.length === 1 ? 'pago' : 'pagos'}
                    {pendingCount > 0 && ` • ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
                    {approvedCount > 0 && ` • ${approvedCount} aprobado${approvedCount !== 1 ? 's' : ''}`}
                    {rejectedCount > 0 && ` • ${rejectedCount} rechazado${rejectedCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* Badge con contador */}
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {isExpanded ? 'Minimizar' : 'Expandir'}
                </span>
              </div>
            </button>

            {/* Contenido del grupo */}
            {isExpanded && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  {grupo.pagos.map((pago) => {
                    const business = Array.isArray(pago.businesses) ? pago.businesses[0] : pago.businesses
                    const plan = Array.isArray(pago.premium_plans) ? pago.premium_plans[0] : pago.premium_plans
                    const profile = profilesMap.get(pago.user_id)

                    return (
                      <div
                        key={pago.id}
                        className={`bg-white/10 backdrop-blur-md p-6 rounded-2xl border-2 ${statusColors[pago.status]} hover:border-blue-500 transition-all`}
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-1">
                                {business?.name || "Negocio desconocido"}
                              </h3>
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
                              {statusLabels[pago.status]}
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
                              🕐 {new Date(pago.created_at).toLocaleTimeString("es-ES", {
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

                        {/* Screenshot con Signed URL */}
                        {pago.screenshot_url && (
                          <div className="mt-4 mb-4">
                            <PaymentReceiptImage
                              screenshotUrl={pago.screenshot_url}
                              businessName={business?.name}
                              paymentId={pago.id}
                            />
                          </div>
                        )}

                        {/* BOTONES */}
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
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

