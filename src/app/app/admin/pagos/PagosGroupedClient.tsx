"use client"

import { useState } from "react"
import RevertPaymentButton from "./RevertPaymentButton"
import PaymentActionButton from "../components/PaymentActionButton"
import PaymentReceiptImage from "../components/PaymentReceiptImage"
import { getLabelForTier } from "@/lib/memberships/tiers"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

interface Business {
  name: string
}

interface Profile {
  id: string
  email?: string
  full_name?: string
}

interface Pago {
  id: string
  user_id: string
  /** Opcional: la membresía es de la CUENTA, no de un negocio */
  business_id?: string | null
  /** Nivel de membresía comprado: 1 Conecta, 2 Destaca, 3 Patrocina */
  target_tier?: number | null
  /** Meses comprados */
  months?: number | null
  amount_usd: number
  payment_method: string
  reference?: string
  screenshot_url?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  admin_notes?: string
  businesses?: Business | Business[] | null
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
    pending: "border-amber-200 bg-amber-50",
    approved: "border-green-200 bg-green-50",
    rejected: "border-red-200 bg-red-50"
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
          <div key={grupo.fechaDisplay} className="border border-black/8 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Header del grupo - Clickeable para expandir/colapsar */}
            <button
              onClick={() => toggleGrupo(grupo.fechaDisplay)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Icono de expandir/colapsar */}
                <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <svg className="w-5 h-5 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Fecha */}
                <div className="text-left">
                  <h2 className="text-xl font-bold text-ink">
                    📅 {grupo.fechaDisplay}
                  </h2>
                  <p className="text-sm text-ink-2 mt-1">
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
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs text-ink-2/70">
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
                    const profile = profilesMap.get(pago.user_id)
                    const tierNum = Number(pago.target_tier ?? 0)
                    const tierLabel = tierNum > 0 ? getLabelForTier(tierNum as SubscriptionTier) : null
                    const months = Number(pago.months ?? 0)
                    // Título: la membresía es de la cuenta; el negocio es solo contexto opcional
                    const heading = profile?.full_name || profile?.email || `Usuario ${pago.user_id.substring(0, 8)}`

                    return (
                      <div
                        key={pago.id}
                        className={`bg-white p-6 rounded-2xl border-2 ${statusColors[pago.status]} hover:border-blue-300 transition-all shadow-sm`}
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-1 text-ink">
                                {heading}
                              </h3>
                              <p className="text-ink-2 text-sm mb-1">
                                Membresía: {tierLabel ?? "N/A"}
                                {months > 0 && ` · ${months} ${months === 1 ? "mes" : "meses"}`}
                              </p>
                              {business?.name && (
                                <p className="text-ink-2 text-xs mb-2">
                                  Negocio: {business.name}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              pago.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                              pago.status === 'approved' ? 'bg-green-50 text-green-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {statusLabels[pago.status]}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-ink-2 mb-2">
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
                            <p className="text-xs text-ink-2/70">
                              🕐 {new Date(pago.created_at).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          )}
                          {pago.admin_notes && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs text-blue-700 font-semibold mb-1">📝 Notas del Admin:</p>
                              <p className="text-xs text-blue-700/80">{pago.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Screenshot con Signed URL */}
                        {pago.screenshot_url && (
                          <div className="mt-4 mb-4">
                            <PaymentReceiptImage
                              screenshotUrl={pago.screenshot_url}
                              businessName={business?.name ?? heading}
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
                          <div className="mt-4 text-xs text-ink-2">
                            Este pago ya fue procesado ({pago.status === 'approved' ? 'aprobado' : 'rechazado'})
                            {/* Sólo lo aprobado se puede revertir: revertir un
                                rechazo restaría meses que nadie sumó. */}
                            {pago.status === 'approved' && (
                              <RevertPaymentButton paymentId={pago.id} />
                            )}
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

