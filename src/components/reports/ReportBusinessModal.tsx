"use client"
import React, { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

interface ReportBusinessModalProps {
  businessId: string
  businessName: string
  onClose: () => void
  onSuccess?: () => void
}

const REPORT_REASONS = [
  "Contenido inapropiado",
  "Información falsa o engañosa",
  "Spam o publicidad excesiva",
  "Contenido ofensivo",
  "Negocio inexistente o cerrado",
  "Otro motivo"
]

export default function ReportBusinessModal({
  businessId,
  businessName,
  onClose,
  onSuccess
}: ReportBusinessModalProps) {
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!reason) {
      setError("Por favor selecciona un motivo")
      return
    }

    const finalReason = reason === "Otro motivo" 
      ? customReason.trim() || reason
      : reason

    if (!finalReason || finalReason.length < 5) {
      setError("Por favor proporciona más detalles sobre el motivo del reporte")
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Debes iniciar sesión para reportar")
        return
      }

      const { error: reportError } = await supabase
        .from("business_reports")
        .insert({
          business_id: businessId,
          reporter_id: user.id,
          reason: finalReason,
          status: "pending"
        })

      if (reportError) throw reportError

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error("Error reportando negocio:", err)
      setError(err.message || "Error al enviar el reporte. Por favor intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reporte Enviado</h3>
          <p className="text-gray-600">Gracias por tu reporte. Lo revisaremos pronto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Reportar Negocio</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Estás reportando: <span className="font-semibold">{businessName}</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Motivo del reporte *
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === "Otro motivo" && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Describe el motivo *
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Por favor describe el motivo del reporte..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


