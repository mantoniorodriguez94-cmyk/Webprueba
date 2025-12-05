/**
 * API Route: Aprobar pago manual (ADMIN)
 * POST /api/admin/payments/approve
 * 
 * Aprueba un pago manual y activa la suscripción premium
 * NOTA: Requiere permisos de admin (implementar según tu lógica)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para API routes (servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado - Token faltante' },
        { status: 401 }
      )
    }

    // Verificar el token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado - Token inválido' },
        { status: 401 }
      )
    }

    // TODO: Verificar que el usuario es admin
    // Esto depende de cómo implementes los roles en tu app
    // Por ejemplo, podrías tener un campo is_admin en la tabla profiles
    // o usar metadata en auth.users
    
    // Ejemplo básico (ajusta según tu implementación):
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('is_admin')
    //   .eq('id', user.id)
    //   .single()
    // 
    // if (!profile?.is_admin) {
    //   return NextResponse.json(
    //     { success: false, error: 'No autorizado' },
    //     { status: 403 }
    //   )
    // }

    // Parsear body
    const body = await request.json()
    const { submission_id, admin_notes } = body

    if (!submission_id) {
      return NextResponse.json(
        { success: false, error: 'submission_id requerido' },
        { status: 400 }
      )
    }

    // Obtener información del pago manual
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .select('*, premium_plans(*)')
      .eq('id', submission_id)
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

    // Actualizar submission a 'approved'
    const { error: updateSubmissionError } = await supabase
      .from('manual_payment_submissions')
      .update({
        status: 'approved',
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission_id)

    if (updateSubmissionError) {
      console.error('Error actualizando submission:', updateSubmissionError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el pago' },
        { status: 500 }
      )
    }

    // Actualizar payment a 'completed'
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('external_id', submission_id)
      .eq('method', 'manual')

    // Calcular fechas de la suscripción
    const startDate = new Date()
    const endDate = calculateEndDate(submission.premium_plans.billing_period)

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
      console.error('Error activando premium:', updateBusinessError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pago aprobado y premium activado exitosamente',
    })

  } catch (error: any) {
    console.error('Error en approve payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

