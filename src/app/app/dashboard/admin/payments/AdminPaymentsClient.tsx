"use client"

/**
 * Cliente interactivo para el Panel de Pagos Manuales
 * Maneja filtros, acciones y modal de imagen
 */

import { useState, useEffect } from "react"
import type { ManualPaymentSubmission } from "@/types/subscriptions"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

interface SubmissionWithDetails extends ManualPaymentSubmission {
  business: {
    name: string
  }
  plan: {
    name: string
    price_usd: number
  }
  user: {
    full_name?: string
  } | null
}

// Componente para mostrar la imagen del comprobante usando signed URLs
function ReceiptImage({ 
  submission, 
  onImageClick,
  onDownload
}: { 
  submission: SubmissionWithDetails
  onImageClick: (url: string) => void
  onDownload: (url: string, fileName: string) => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true)
        setError(false)

        // Extraer el path del archivo desde la URL guardada
        const screenshotUrl = submission.screenshot_url
        if (!screenshotUrl) {
          setError(true)
          setIsLoading(false)
          return
        }

        // Extraer el path del archivo desde la URL
        // La URL guardada es: https://xxx.supabase.co/storage/v1/object/public/payment_receipts/userId/businessId/file.jpg
        // Necesitamos extraer: userId/businessId/file.jpg
        let filePath = ''
        
        try {
          // Buscar el path después de "payment_receipts/"
          const match = screenshotUrl.match(/payment_receipts[\/\\](.+?)(?:\?|$)/)
          if (match && match[1]) {
            filePath = match[1]
          } else {
            // Si no encontramos el patrón, intentar parsear como URL
            const url = new URL(screenshotUrl)
            const pathParts = url.pathname.split('/')
            const bucketIndex = pathParts.findIndex(p => p === 'payment_receipts')
            
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              filePath = pathParts.slice(bucketIndex + 1).join('/')
            }
          }
        } catch (urlError) {
          // Si no es una URL válida, intentar extraer con regex directamente
          const match = screenshotUrl.match(/payment_receipts[\/\\](.+?)(?:\?|$)/)
          if (match && match[1]) {
            filePath = match[1]
          }
        }

        if (!filePath) {
          // Si no podemos extraer el path, intentar usar la URL directamente
          // Esto puede funcionar si el bucket es público
          console.warn('No se pudo extraer el path del archivo, usando URL original:', screenshotUrl)
          setImageUrl(screenshotUrl)
          setIsLoading(false)
          return
        }

        // Generar signed URL válida por 1 hora
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('payment_receipts')
          .createSignedUrl(filePath, 3600) // 1 hora

        if (signedUrlError || !signedUrlData) {
          console.warn('Error generando signed URL, usando URL original:', signedUrlError)
          // Fallback a URL pública o original
          setImageUrl(screenshotUrl)
        } else {
          setImageUrl(signedUrlData.signedUrl)
        }
      } catch (err) {
        console.error('Error cargando imagen:', err)
        setError(true)
        // Fallback a URL original
        setImageUrl(submission.screenshot_url)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [submission.screenshot_url, submission.id])

  const displayUrl = imageUrl || submission.screenshot_url

  return (
    <>
      <div 
        className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => displayUrl && onImageClick(displayUrl)}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error || !displayUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No se pudo cargar la imagen</p>
            </div>
          </div>
        ) : (
          <Image
            src={displayUrl}
            alt="Comprobante de pago"
            fill
            className="object-contain"
            onError={() => {
              setError(true)
            }}
          />
        )}
      </div>
      <div className="flex gap-2 mt-2 justify-center">
        <button
          onClick={() => {
            const url = imageUrl || submission.screenshot_url
            if (url) {
              const fileName = `comprobante-${submission.id}.jpg`
              onDownload(url, fileName)
            }
          }}
          disabled={isLoading || error || !imageUrl}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Descargar comprobante"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar
        </button>
        <button
          onClick={() => {
            const url = imageUrl || submission.screenshot_url
            if (url) onImageClick(url)
          }}
          disabled={isLoading || error || !imageUrl}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ver en pantalla completa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Ampliar
        </button>
      </div>
    </>
  )
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

  // Manejar tecla ESC para cerrar el modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedImage])

  // Función para descargar la imagen
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Si es una signed URL o URL pública, podemos descargarla directamente
      const response = await fetch(url)
      const blob = await response.blob()
      
      // Crear un enlace temporal y hacer clic para descargar
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Error descargando imagen:', err)
      alert('Error al descargar la imagen. Por favor, intenta nuevamente.')
    }
  }

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
    if (!confirm('¿Estás seguro de que deseas aprobar este pago? Esto activará el plan premium.')) {
      return
    }

    const notes = prompt('Notas del admin (opcional):')
    
    setProcessing(submissionId)

    try {
      const response = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error aprobando pago')
      }

      alert('✅ Pago aprobado exitosamente. El premium ha sido activado.')
      
      // Si estamos viendo pendientes, recargar para que desaparezca de la lista
      if (filter === 'pending') {
        loadSubmissions('pending')
      } else {
        loadSubmissions(filter)
      }

    } catch (err: any) {
      console.error('Error aprobando pago:', err)
      alert(`❌ Error: ${err.message || 'Error desconocido'}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    // Verificar que han pasado al menos 24 horas
    const submission = submissions.find(s => s.id === submissionId)
    if (!submission) {
      alert('Error: No se encontró el pago')
      return
    }

    const createdAt = new Date(submission.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCreation < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceCreation)
      alert(`⏳ No se puede rechazar el pago todavía. Debes esperar al menos 24 horas desde que fue enviado. Faltan aproximadamente ${hoursRemaining} horas.`)
      return
    }

    const notes = prompt('Motivo del rechazo (este mensaje se enviará al usuario):')
    if (!notes || notes.trim() === '') {
      alert('❌ Debes proporcionar un motivo para el rechazo')
      return
    }

    if (!confirm('¿Estás seguro de que deseas rechazar este pago?')) {
      return
    }

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

      alert('✅ Pago rechazado exitosamente. El usuario ha sido notificado.')
      
      // Si estamos viendo pendientes, recargar para que desaparezca de la lista
      if (filter === 'pending') {
        loadSubmissions('pending')
      } else {
        loadSubmissions(filter)
      }

    } catch (err: any) {
      console.error('Error rechazando pago:', err)
      alert(`❌ Error: ${err.message || 'Error desconocido'}`)
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

  // Función para verificar si han pasado 24 horas
  const canReject = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursSinceCreation >= 24
  }

  // Función para obtener horas restantes hasta poder rechazar
  const getHoursUntilCanReject = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return Math.max(0, Math.ceil(24 - hoursSinceCreation))
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
                      <p className="text-gray-400 text-sm">{submission.user?.full_name || 'Usuario'}</p>
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
                      <div className="space-y-2 pt-3">
                        <button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processing === submission.id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === submission.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => handleReject(submission.id)}
                            disabled={processing === submission.id || !canReject(submission.created_at)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === submission.id ? 'Procesando...' : 'Rechazar'}
                          </button>
                          {!canReject(submission.created_at) && (
                            <div className="absolute -top-8 left-0 right-0 bg-yellow-600 text-white text-xs py-1 px-2 rounded text-center z-10">
                              Espera {getHoursUntilCanReject(submission.created_at)}h más para rechazar
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Captura de pantalla */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Comprobante de Pago</p>
                    <ReceiptImage 
                      submission={submission}
                      onImageClick={(url) => setSelectedImage(url)}
                      onDownload={handleDownload}
                    />
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
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            // Cerrar solo si se hace clic en el fondo, no en la imagen
            if (e.target === e.currentTarget) {
              setSelectedImage(null)
            }
          }}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
              <Image
                src={selectedImage}
                alt="Comprobante ampliado"
                width={1920}
                height={1080}
                className="max-w-full max-h-full object-contain"
                unoptimized
                priority
              />
            </div>
            
            {/* Botones de control */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(selectedImage)
                    const blob = await response.blob()
                    const downloadUrl = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = downloadUrl
                    link.download = `comprobante-${Date.now()}.jpg`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(downloadUrl)
                  } catch (err) {
                    console.error('Error descargando imagen:', err)
                    alert('Error al descargar la imagen')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                title="Descargar imagen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title="Cerrar (ESC)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Instrucciones */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg">
              Click fuera de la imagen o presiona ESC para cerrar
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
