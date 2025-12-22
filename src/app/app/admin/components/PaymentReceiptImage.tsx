"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

interface PaymentReceiptImageProps {
  screenshotUrl: string
  businessName?: string
  paymentId: string
}

/**
 * Componente para mostrar imágenes de comprobantes de pago usando Signed URLs
 * Soluciona el problema de buckets privados en producción
 */
export default function PaymentReceiptImage({
  screenshotUrl,
  businessName,
  paymentId
}: PaymentReceiptImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const generateSignedUrl = async () => {
      try {
        setIsLoading(true)
        setError(false)

        if (!screenshotUrl) {
          setError(true)
          setIsLoading(false)
          return
        }

        // Extraer el path del archivo desde la URL completa
        // URL esperada: https://xxx.supabase.co/storage/v1/object/public/payment_receipts/userId/businessId/file.jpg
        // Necesitamos: userId/businessId/file.jpg
        let filePath = ''

        try {
          // Intentar extraer el path después de "payment_receipts/"
          const match = screenshotUrl.match(/payment_receipts[\/\\](.+?)(?:\?|$)/)
          if (match && match[1]) {
            filePath = match[1]
          } else {
            // Si no funciona el regex, intentar parsear como URL
            const url = new URL(screenshotUrl)
            const pathParts = url.pathname.split('/')
            const bucketIndex = pathParts.findIndex(p => p === 'payment_receipts')
            
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              filePath = pathParts.slice(bucketIndex + 1).join('/')
            }
          }
        } catch (urlError) {
          console.warn('Error parseando URL:', urlError)
          // Último intento: usar regex directo
          const match = screenshotUrl.match(/payment_receipts[\/\\](.+?)(?:\?|$)/)
          if (match && match[1]) {
            filePath = match[1]
          }
        }

        if (!filePath) {
          console.warn('No se pudo extraer el path del archivo, usando URL original')
          setSignedUrl(screenshotUrl)
          setIsLoading(false)
          return
        }

        // Generar Signed URL válida por 1 hora (3600 segundos) usando el cliente de Supabase
        const { data, error: signedUrlError } = await supabase.storage
          .from('payment_receipts')
          .createSignedUrl(filePath, 3600)

        if (signedUrlError || !data) {
          console.warn('Error generando signed URL, usando fallback:', signedUrlError)
          setSignedUrl(screenshotUrl)
        } else {
          setSignedUrl(data.signedUrl)
        }

      } catch (err) {
        console.error('Error cargando imagen:', err)
        setError(true)
        setSignedUrl(screenshotUrl) // Fallback
      } finally {
        setIsLoading(false)
      }
    }

    generateSignedUrl()
  }, [screenshotUrl])

  const handleDownload = async () => {
    if (!signedUrl) return

    try {
      const response = await fetch(signedUrl)
      const blob = await response.blob()
      
      const fileName = `comprobante-${(businessName || paymentId).replace(/[^a-z0-9]/gi, '_')}-${paymentId}.jpg`
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

  const displayUrl = signedUrl || screenshotUrl

  return (
    <>
      <div>
        <p className="text-xs text-gray-400 mb-2">Comprobante de pago:</p>
        
        {/* Contenedor de la imagen */}
        <div 
          className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:opacity-90 transition-opacity relative bg-black/40"
          onClick={() => displayUrl && setIsModalOpen(true)}
        >
          {isLoading ? (
            <div className="w-full aspect-video flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error || !displayUrl ? (
            <div className="w-full aspect-video flex items-center justify-center text-gray-500">
              <div className="text-center p-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No se pudo cargar la imagen</p>
              </div>
            </div>
          ) : (
            <Image
              src={displayUrl}
              width={400}
              height={400}
              alt="Comprobante de pago"
              className="w-full h-auto object-contain"
              unoptimized
              onError={() => setError(true)}
            />
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            disabled={!displayUrl || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isLoading ? 'Cargando...' : 'Descargar'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (displayUrl) setIsModalOpen(true)
            }}
            disabled={!displayUrl || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Ver completo
          </button>
        </div>
      </div>

      {/* Modal de imagen completa */}
      {isModalOpen && displayUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
            }
          }}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
              <Image
                src={displayUrl}
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
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                title="Descargar imagen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
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
    </>
  )
}

