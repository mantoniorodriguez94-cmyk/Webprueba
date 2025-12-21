/**
 * API Route: Rechazar pago manual (ADMIN)
 * POST /api/admin/payments/reject
 * 
 * Rechaza un pago manual con notas del admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

// Cliente de Supabase con service role para operaciones admin (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
        { success: false, error: 'submissionId requerido' },
        { status: 400 }
      )
    }

    // Obtener información del pago manual (incluyendo created_at para validar 24h)
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .select('id, status, created_at, user_id, business_id')
      .eq('id', submission_id_final)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Pago manual no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que está pendiente
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue procesado' },
        { status: 400 }
      )
    }

    // Validar que han pasado al menos 24 horas
    const createdAt = new Date(submission.created_at)
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
    const { error: updateSubmissionError } = await supabase
      .from('manual_payment_submissions')
      .update({
        status: 'rejected',
        admin_notes: admin_notes || 'Pago rechazado',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submission_id_final)

    if (updateSubmissionError) {
      console.error('Error actualizando submission:', updateSubmissionError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el pago' },
        { status: 500 }
      )
    }

    // Actualizar payment a 'failed'
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('external_id', submission_id_final)
      .eq('method', 'manual')

    // TODO: Aquí podrías agregar una notificación al usuario
    // Por ejemplo, crear un registro en una tabla de notificaciones
    // o enviar un email. Por ahora, el usuario verá el estado 'rejected'
    // cuando consulte su pago, y las admin_notes contienen el motivo.
    // 
    // Ejemplo de cómo podrías implementarlo:
    // await supabase.from('notifications').insert({
    //   user_id: submission.user_id,
    //   type: 'payment_rejected',
    //   title: 'Pago Rechazado',
    //   message: `Tu pago fue rechazado. Motivo: ${admin_notes}`,
    //   related_id: submission_id_final
    // })

    return NextResponse.json({
      success: true,
      message: 'Pago rechazado exitosamente. El usuario será notificado al revisar su estado de pago.',
      user_id: submission.user_id, // Para referencia
    })

  } catch (error: any) {
    console.error('Error en reject payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

