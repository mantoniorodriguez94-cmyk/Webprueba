/**
 * API Route: Rechazar pago manual (ADMIN)
 * POST /api/admin/payments/reject
 * 
 * Rechaza un pago manual con notas del admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { registrarAccionAdmin } from "@/lib/auditoria"
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { PaymentRejectedTemplate } from '@/lib/emails/templates'
import { getLabelForTier } from '@/lib/memberships/tiers'
import type { SubscriptionTier } from '@/lib/memberships/tiers'

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

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    // Obtener información del pago manual (incluyendo created_at para validar 24h)
    // IMPORTANTE: Usamos el cliente admin que bypasea RLS
    const { data: submission, error: submissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .select('id, status, created_at, user_id, business_id, target_tier, months')
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

    // Los pagos son la acción más sensible del panel y eran la única que no
    // quedaba registrada. La fila guarda reviewed_by, pero eso obliga a
    // consultar la base para saber quién rechazó qué; acá queda a la vista
    // junto al resto de las acciones.
    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: "payment.reject",
      objetoTipo: "payment",
      objetoId: String(submission_id_final),
      detalle: {
        usuario_id: submissionData.user_id,
        monto_usd: submissionData.amount_usd,
        nivel: submissionData.target_tier,
        meses: submissionData.months,
        motivo: admin_notes || null,
      },
    })

    // NOTA: los pagos manuales no se escriben en la tabla `payments`. Estaba
    // reservada para el sistema de referidos y comisiones, que se eliminó por
    // no usarse; la tabla quedó sin ningún consumidor.

    // Etiqueta legible del nivel + duración solicitados (para el correo)
    const rejectedTier = Number(submissionData.target_tier)
    const rejectedMonths = Number(submissionData.months)
    const planLabel =
      Number.isFinite(rejectedTier) && rejectedTier > 0 && Number.isFinite(rejectedMonths) && rejectedMonths > 0
        ? `${getLabelForTier(rejectedTier as SubscriptionTier)} · ${rejectedMonths} ${rejectedMonths === 1 ? 'mes' : 'meses'}`
        : 'que enviaste'

    // Enviar correo de rechazo (no bloqueante)
    if (resend) {
      try {
        // Obtener email del usuario
        const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(submissionData.user_id)

        if (!userError && userData?.user?.email) {
          // Enviar correo
          await resend.emails.send({
            from: FROM_EMAIL,
            to: userData.user.email,
            subject: `Pago No Verificado - Acción Requerida`,
            html: PaymentRejectedTemplate(planLabel),
          })
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
