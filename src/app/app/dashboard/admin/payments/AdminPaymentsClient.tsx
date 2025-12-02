"use client"

/**
 * Cliente interactivo para el Panel de Pagos Manuales
 * Maneja filtros, acciones y modal de imagen
 */

import { useState } from "react"
import type { ManualPaymentSubmission } from "@/types/subscriptions"
import Image from "next/image"

interface SubmissionWithDetails extends ManualPaymentSubmission {
  business: {
    name: string
  }
  plan: {
    name: string
    price_usd: number
  }
  user: {
    email: string
  }
}

interface AdminPaymentsClientProps {
  initialSubmissions: SubmissionWithDetails[]
  initialFilter: 'pending' | 'approved' | 'rejected'
}

export default function AdminPaymentsClient({ 
  initialSubmissions, 
  initialFilter 
}: AdminPaymentsClientProps) {
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>(initialSubmissions)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>(initialFilter)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const loadSubmissions = async (newFilter: 'pending' | 'approved' | 'rejected') => {
    try {
      setLoading(true)
      setFilter(newFilter)

      const response = await fetch(`/api/admin/payments/list?status=${newFilter}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error cargando pagos')
      }

      setSubmissions(data.submissions || [])

    } catch (err: any) {
      console.error('Error cargando pagos:', err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: 'pending' | 'approved' | 'rejected') => {
    if (newFilter !== filter) {
      loadSubmissions(newFilter)
    }
  }

  const handleApprove = async (submissionId: string) => {
    const notes = prompt('Notas del admin (opcional):')
    
    setProcessing(submissionId)

    try {
      const response = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_notes: notes,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error aprobando pago')
      }

      alert('Pago aprobado exitosamente')
      loadSubmissions(filter)

    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    const notes = prompt('Motivo del rechazo:')
    if (!notes) return

    setProcessing(submissionId)

    try {
      const response = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_notes: notes,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error rechazando pago')
      }

      alert('Pago rechazado')
      loadSubmissions(filter)

    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Admin - Pagos Manuales</h1>
          <p className="text-gray-400 text-sm">Gestiona las verificaciones de pagos manuales</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => handleFilterChange('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Aprobados
          </button>
          <button
            onClick={() => handleFilterChange('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Rechazados
          </button>
        </div>

        {/* Lista de Pagos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando pagos...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay pagos {filter === 'pending' ? 'pendientes' : filter}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Información */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{submission.business?.name || 'N/A'}</h3>
                      <p className="text-gray-400 text-sm">{submission.user?.email || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Plan</p>
                        <p className="text-white font-semibold">{submission.plan?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Monto</p>
                        <p className="text-white font-semibold">${submission.amount_usd}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Método</p>
                        <p className="text-white">{submission.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Fecha</p>
                        <p className="text-white">{formatDate(submission.created_at)}</p>
                      </div>
                    </div>

                    {submission.reference && (
                      <div>
                        <p className="text-gray-400 text-sm">Referencia</p>
                        <p className="text-white">{submission.reference}</p>
                      </div>
                    )}

                    {submission.admin_notes && (
                      <div>
                        <p className="text-gray-400 text-sm">Notas del Admin</p>
                        <p className="text-white">{submission.admin_notes}</p>
                      </div>
                    )}

                    {/* Botones de acción */}
                    {submission.status === 'pending' && (
                      <div className="flex gap-2 pt-3">
                        <button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processing === submission.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processing === submission.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          disabled={processing === submission.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Captura de pantalla */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Comprobante de Pago</p>
                    <div 
                      className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(submission.screenshot_url)}
                    >
                      <Image
                        src={submission.screenshot_url}
                        alt="Comprobante de pago"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1 text-center">
                      Click para ampliar
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para ver imagen completa */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full aspect-video">
            <Image
              src={selectedImage}
              alt="Comprobante ampliado"
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

