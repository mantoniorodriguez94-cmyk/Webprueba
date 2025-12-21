/**
 * API Route: Obtener signed URL de comprobante de pago (ADMIN)
 * GET /api/admin/payments/get-receipt-url?submission_id=xxx
 * 
 * Genera una signed URL para que los admins puedan ver las imágenes
 * de comprobantes en buckets privados
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Obtener submission_id de query params
    const searchParams = request.nextUrl.searchParams
    const submission_id = searchParams.get('submission_id')

    if (!submission_id) {
      return NextResponse.json(
        { success: false, error: 'submission_id requerido' },
        { status: 400 }
      )
    }

    // Usar service role para obtener el submission
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener información del submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('manual_payment_submissions')
      .select('screenshot_url')
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission || !submission.screenshot_url) {
      return NextResponse.json(
        { success: false, error: 'Comprobante no encontrado' },
        { status: 404 }
      )
    }

    // Extraer el path del archivo desde la URL
    // La URL puede ser pública o signed, necesitamos extraer el path
    let filePath = ''
    const screenshotUrl = submission.screenshot_url

    try {
      const url = new URL(screenshotUrl)
      // Si es una URL pública de Supabase: /storage/v1/object/public/payment_receipts/...
      // O signed: /storage/v1/object/sign/payment_receipts/...
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(p => p === 'payment_receipts')
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // El path del archivo es todo después del bucket
        filePath = pathParts.slice(bucketIndex + 1).join('/')
      } else {
        // Si no está en el formato esperado, intentar extraer de otra forma
        // A veces puede ser solo el path relativo
        const match = screenshotUrl.match(/payment_receipts\/(.+)$/)
        if (match) {
          filePath = match[1]
        } else {
          // Último recurso: usar todo después de payment_receipts/
          const idx = screenshotUrl.indexOf('payment_receipts/')
          if (idx !== -1) {
            filePath = screenshotUrl.substring(idx + 'payment_receipts/'.length)
          }
        }
      }
    } catch (urlError) {
      // Si la URL no es válida, intentar extraer el path de otra forma
      const match = screenshotUrl.match(/payment_receipts[\/\\](.+)/)
      if (match) {
        filePath = match[1].split('?')[0] // Remover query params si los hay
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No se pudo extraer el path del archivo' },
        { status: 400 }
      )
    }

    // Generar signed URL válida por 1 hora
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('payment_receipts')
      .createSignedUrl(filePath, 3600) // 1 hora

    if (signedUrlError || !signedUrlData) {
      console.error('Error generando signed URL:', signedUrlError)
      
      // Si falla, intentar con URL pública como fallback
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('payment_receipts')
        .getPublicUrl(filePath)

      return NextResponse.json({
        success: true,
        url: publicUrl || screenshotUrl, // Fallback a la URL original
        isPublic: true
      })
    }

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      isPublic: false
    })

  } catch (error: any) {
    console.error('Error en get-receipt-url:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

