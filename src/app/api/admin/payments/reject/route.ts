/**
 * API Route: Rechazar pago manual (ADMIN)
 * POST /api/admin/payments/reject
 * 
 * Rechaza un pago manual con notas del admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para API routes (servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    // (Misma lógica que en approve/route.ts)

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
      .select('id, status')
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

    // Actualizar submission a 'rejected'
    const { error: updateSubmissionError } = await supabase
      .from('manual_payment_submissions')
      .update({
        status: 'rejected',
        admin_notes: admin_notes || 'Pago rechazado',
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

    // Actualizar payment a 'failed'
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('external_id', submission_id)
      .eq('method', 'manual')

    return NextResponse.json({
      success: true,
      message: 'Pago rechazado exitosamente',
    })

  } catch (error: any) {
    console.error('Error en reject payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

