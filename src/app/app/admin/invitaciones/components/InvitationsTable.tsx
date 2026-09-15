"use client"

import { useState, useMemo } from "react"
import { confirmModal } from "@/lib/confirmModal"
import Link from "next/link"
import type { InvitationData } from "../page"
import { alertModal } from "@/lib/alertModal"

interface InvitationsTableProps {
  invitations: InvitationData[]
}

export default function InvitationsTable({ invitations }: InvitationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Filtrar invitaciones por nombre del negocio
  const filteredInvitations = useMemo(() => {
    if (!searchQuery.trim()) {
      return invitations
    }

    const query = searchQuery.toLowerCase().trim()
    return invitations.filter((inv) =>
      inv.business_name.toLowerCase().includes(query)
    )
  }, [invitations, searchQuery])

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Error copiando código:", err)
    }
  }

  const handleRegenerate = async (businessId: string) => {
    const confirmado = await confirmModal("¿Regenerar este código?", {
      description: "El código anterior quedará inválido de inmediato.",
      confirmLabel: "Regenerar",
    })
    if (confirmado) {
      try {
        const response = await fetch("/api/admin/business/generate-claim-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ businessId }),
        })

        const data = await response.json()

        if (data.success) {
          // Recargar la página para ver el nuevo código
          window.location.reload()
        } else {
          alertModal.error("Error al regenerar código", {
            description: data.error
          })
        }
      } catch (err) {
        console.error("Error regenerando código:", err)
        alertModal.error("Error de conexión al regenerar código")
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-ink-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre del negocio..."
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black/15 rounded-xl text-ink placeholder-ink-2/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Tabla de invitaciones */}
      {filteredInvitations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">
                  Negocio
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">
                  Código
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">
                  Fecha de Creación
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-ink-2">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="border-b border-black/5 hover:bg-black/[0.02] transition-colors"
                >
                  {/* Negocio */}
                  <td className="py-4 px-4">
                    <Link
                      href={`/app/admin/negocios/${invitation.business_id}`}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {invitation.business_name}
                    </Link>
                  </td>

                  {/* Código */}
                  <td className="py-4 px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-lg border border-black/10">
                      <code className="font-mono text-sm font-semibold text-blue-700 tracking-wider">
                        {invitation.code}
                      </code>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-4">
                    {invitation.is_claimed ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/5 text-ink-2 border border-black/10">
                        Reclamado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* Fecha de Creación */}
                  <td className="py-4 px-4 text-sm text-ink-2">
                    {new Date(invitation.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Botón Copiar */}
                      <button
                        onClick={() => handleCopyCode(invitation.code)}
                        className="w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 flex items-center justify-center transition-all group"
                        title={copiedCode === invitation.code ? "Copiado!" : "Copiar código"}
                      >
                        {copiedCode === invitation.code ? (
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-blue-600 group-hover:text-blue-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Botón Regenerar (solo si está pendiente) */}
                      {!invitation.is_claimed && (
                        <button
                          onClick={() => handleRegenerate(invitation.business_id)}
                          className="w-9 h-9 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 flex items-center justify-center transition-all group"
                          title="Regenerar código"
                        >
                          <svg
                            className="w-5 h-5 text-amber-600 group-hover:text-amber-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-ink-2">
          <p className="text-lg mb-2">
            {searchQuery
              ? "No se encontraron invitaciones con ese nombre"
              : "No hay invitaciones registradas"}
          </p>
          <p className="text-sm">
            {searchQuery
              ? "Intenta con otro término de búsqueda"
              : "Las invitaciones aparecerán aquí cuando se generen códigos de reclamación"}
          </p>
        </div>
      )}
    </div>
  )
}

