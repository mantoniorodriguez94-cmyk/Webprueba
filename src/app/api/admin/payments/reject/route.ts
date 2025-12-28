/**
 * API Route: Rechazar pago manual (ADMIN)
 * POST /api/admin/payments/reject
 * 
 * Rechaza un pago manual con notas del admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { PaymentRejectedTemplate } from '@/lib/emails/templates'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario es admin usando nuestra utilidad
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { submissionId, submission_id, admin_notes } = body
    const submission_id_final = submissionId || submission_id // Soporta ambos nombres

    if (!submission_id_final) {
      return NextResponse.json(
        { success: false, error: 'submission_id es requerido' },
        { status: 400 }
      )
    }

    console.log('[REJECT] Buscando pago con ID:', submission_id_final)

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    // Obtener información del pago manual (incluyendo created_at para validar 24h)
    // IMPORTANTE: Usamos el cliente admin que bypasea RLS
    const { data: submission, error: submissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .select('id, status, created_at, user_id, business_id')
      .eq('id', submission_id_final)
      .single()

    if (submissionError) {
      console.error('[REJECT] Error buscando submission:', submissionError)
      return NextResponse.json(
        { success: false, error: `Error al buscar el pago: ${submissionError.message}` },
        { status: 404 }
      )
    }

    if (!submission) {
      console.error('[REJECT] Submission no encontrado con ID:', submission_id_final)
      return NextResponse.json(
        { success: false, error: 'Pago manual no encontrado' },
        { status: 404 }
      )
    }

    const submissionData = submission as any
    console.log('[REJECT] Submission encontrado:', submissionData.id, 'Status:', submissionData.status)

    // Verificar que está pendiente
    if (submissionData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue procesado' },
        { status: 400 }
      )
    }

    // Validar que han pasado al menos 24 horas
    const createdAt = new Date(submissionData.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCreation < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceCreation)
      return NextResponse.json(
        { 
          success: false, 
          error: `No se puede rechazar el pago todavía. Debes esperar al menos 24 horas desde que fue enviado. Faltan aproximadamente ${hoursRemaining} horas.` 
        },
        { status: 400 }
      )
    }

    // Actualizar submission a 'rejected'
    const { error: updateSubmissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .update({
        status: 'rejected',
        admin_notes: admin_notes || 'Pago rechazado',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submission_id_final)

    if (updateSubmissionError) {
      console.error('[REJECT] Error actualizando submission:', updateSubmissionError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar el pago: ${updateSubmissionError.message}` },
        { status: 500 }
      )
    }

    console.log('[REJECT] Submission actualizado exitosamente')

    // Actualizar payment a 'failed'
    const { error: updatePaymentError } = await (adminSupabase as any)
      .from('payments')
      .update({ status: 'failed' })
      .eq('external_id', submission_id_final)
      .eq('method', 'manual')

    if (updatePaymentError) {
      console.warn('[REJECT] Advertencia al actualizar payments:', updatePaymentError)
    }

    // Enviar correo de rechazo (no bloqueante)
    if (resend) {
      try {
        // Obtener email del usuario
        const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(submissionData.user_id)
        
        if (!userError && userData?.user?.email) {
          // Obtener nombre del negocio
          const { data: businessData } = await (adminSupabase as any)
            .from('businesses')
            .select('name')
            .eq('id', submissionData.business_id)
            .single()
          
          const businessName = businessData?.name || 'tu negocio'
          
          // Enviar correo
          await resend.emails.send({
            from: FROM_EMAIL,
            to: userData.user.email,
            subject: `Pago No Verificado - Acción Requerida`,
            html: PaymentRejectedTemplate(businessName),
          })
          
          console.log('[REJECT] Correo de rechazo enviado a:', userData.user.email)
        } else {
          console.warn('[REJECT] No se pudo obtener el email del usuario:', userError?.message || 'Usuario no encontrado')
        }
      } catch (emailError: any) {
        // NO hacer rollback del rechazo si el email falla
        console.error('[REJECT] Error enviando correo de rechazo (no crítico):', emailError?.message || emailError)
        // El pago ya fue rechazado, solo logueamos el error
      }
    } else {
      console.warn('[REJECT] Resend no está configurado. Correo no enviado.')
    }

    return NextResponse.json({
      success: true,
      message: 'Pago rechazado exitosamente. El usuario será notificado por correo electrónico.',
      user_id: submissionData.user_id, // Para referencia
    })

  } catch (error: any) {
    console.error('[REJECT] Error en reject payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
