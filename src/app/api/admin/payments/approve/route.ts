/**
 * API Route: Aprobar pago manual (ADMIN)
 * POST /api/admin/payments/approve
 * 
 * Aprueba un pago manual y activa la suscripción premium
 * NOTA: Requiere permisos de admin (implementar según tu lógica)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

// Cliente de Supabase con service role para operaciones admin (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Calcular fecha de fin según el período de facturación
 */
function calculateEndDate(billingPeriod: string): Date {
  const now = new Date()
  
  switch (billingPeriod) {
    case 'monthly':
      now.setDate(now.getDate() + 30)
      break
    case 'quarterly':
      now.setDate(now.getDate() + 90)
      break
    case 'semiannual':
      now.setDate(now.getDate() + 180)
      break
    case 'yearly':
      now.setDate(now.getDate() + 365)
      break
    default:
      now.setDate(now.getDate() + 30)
  }
  
  return now
}

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

    console.log('[APPROVE] Buscando pago con ID:', submission_id_final)

    // Obtener información del pago manual con el plan
    // IMPORTANTE: Usamos el cliente con service role key que bypasea RLS
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .select('*, premium_plans(*)')
      .eq('id', submission_id_final)
      .single()

    if (submissionError) {
      console.error('[APPROVE] Error buscando submission:', submissionError)
      return NextResponse.json(
        { success: false, error: `Error al buscar el pago: ${submissionError.message}` },
        { status: 404 }
      )
    }

    if (!submission) {
      console.error('[APPROVE] Submission no encontrado con ID:', submission_id_final)
      return NextResponse.json(
        { success: false, error: 'Pago manual no encontrado' },
        { status: 404 }
      )
    }

    console.log('[APPROVE] Submission encontrado:', submission.id, 'Status:', submission.status)

    // Verificar que está pendiente
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue procesado' },
        { status: 400 }
      )
    }

    // Actualizar submission a 'approved'
    const { error: updateSubmissionError } = await supabase
      .from('manual_payment_submissions')
      .update({
        status: 'approved',
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submission_id_final)

    if (updateSubmissionError) {
      console.error('[APPROVE] Error actualizando submission:', updateSubmissionError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar el pago: ${updateSubmissionError.message}` },
        { status: 500 }
      )
    }

    console.log('[APPROVE] Submission actualizado exitosamente')

    // Actualizar payment a 'completed'
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('external_id', submission_id_final)
      .eq('method', 'manual')

    if (updatePaymentError) {
      console.warn('[APPROVE] Advertencia al actualizar payments:', updatePaymentError)
    }

    // Calcular fechas de la suscripción según el plan pagado
    const startDate = new Date()
    // El plan viene como premium_plans (puede ser array u objeto)
    const plan = Array.isArray(submission.premium_plans) 
      ? submission.premium_plans[0] 
      : submission.premium_plans
    const billingPeriod = plan?.billing_period || 'monthly'
    const endDate = calculateEndDate(billingPeriod)

    console.log('[APPROVE] Calculando fechas:', { billingPeriod, endDate: endDate.toISOString() })

    // Crear o actualizar suscripción
    const { data: existingSubscription } = await supabase
      .from('business_subscriptions')
      .select('id')
      .eq('business_id', submission.business_id)
      .eq('user_id', submission.user_id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // Extender suscripción existente
      const { error: extendError } = await supabase
        .from('business_subscriptions')
        .update({
          end_date: endDate.toISOString(),
          plan_id: submission.plan_id,
        })
        .eq('id', existingSubscription.id)

      if (extendError) {
        console.error('[APPROVE] Error extendiendo suscripción:', extendError)
      }
    } else {
      // Crear nueva suscripción
      const { error: createError } = await supabase
        .from('business_subscriptions')
        .insert({
          business_id: submission.business_id,
          user_id: submission.user_id,
          plan_id: submission.plan_id,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })

      if (createError) {
        console.error('[APPROVE] Error creando suscripción:', createError)
      }
    }

    // Activar premium en el negocio
    const { error: updateBusinessError } = await supabase
      .from('businesses')
      .update({
        is_premium: true,
        premium_until: endDate.toISOString(),
        premium_plan_id: submission.plan_id,
      })
      .eq('id', submission.business_id)

    if (updateBusinessError) {
      console.error('[APPROVE] Error activando premium:', updateBusinessError)
      return NextResponse.json(
        { success: false, error: `Error al activar premium: ${updateBusinessError.message}` },
        { status: 500 }
      )
    }

    console.log('[APPROVE] Premium activado exitosamente para business:', submission.business_id)

    return NextResponse.json({
      success: true,
      message: 'Pago aprobado y premium activado exitosamente',
    })

  } catch (error: any) {
    console.error('[APPROVE] Error en approve payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
