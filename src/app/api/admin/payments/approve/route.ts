/**
 * API Route: Aprobar pago manual (ADMIN)
 * POST /api/admin/payments/approve
 * 
 * Aprueba un pago manual y activa la suscripción premium
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
    // Verificar que el usuario es admin
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
    const submission_id_final = submissionId || submission_id

    if (!submission_id_final) {
      return NextResponse.json(
        { success: false, error: 'submission_id es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del pago manual - FIX: Usar alias correcto y query separada
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .select('*')
      .eq('id', submission_id_final)
      .single()

    if (submissionError || !submission) {
      console.error('[APPROVE] Error buscando submission:', submissionError)
      return NextResponse.json(
        { success: false, error: `Error al buscar el pago: ${submissionError?.message || 'Pago no encontrado'}` },
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

    // Obtener el plan por separado para evitar problemas con relaciones
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', submission.plan_id)
      .single()

    if (planError || !plan) {
      console.error('[APPROVE] Error buscando plan:', planError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener información del plan' },
        { status: 500 }
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

    // Actualizar payment a 'completed'
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('external_id', submission_id_final)
      .eq('method', 'manual')

    // Calcular fechas de la suscripción según el plan pagado
    const startDate = new Date()
    const billingPeriod = plan.billing_period || 'monthly'
    const endDate = calculateEndDate(billingPeriod)

    // Crear o actualizar suscripción
    const { data: existingSubscription } = await supabase
      .from('business_subscriptions')
      .select('id')
      .eq('business_id', submission.business_id)
      .eq('user_id', submission.user_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingSubscription) {
      // Extender suscripción existente
      await supabase
        .from('business_subscriptions')
        .update({
          end_date: endDate.toISOString(),
          plan_id: submission.plan_id,
        })
        .eq('id', existingSubscription.id)
    } else {
      // Crear nueva suscripción
      await supabase
        .from('business_subscriptions')
        .insert({
          business_id: submission.business_id,
          user_id: submission.user_id,
          plan_id: submission.plan_id,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
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
