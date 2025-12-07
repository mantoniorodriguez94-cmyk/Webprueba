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

    // Obtener información del pago manual
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .select('id, status')
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

    // Actualizar submission a 'rejected'
    const { error: updateSubmissionError } = await supabase
      .from('manual_payment_submissions')
      .update({
        status: 'rejected',
        admin_notes: admin_notes || 'Pago rechazado',
        reviewed_at: new Date().toISOString(),
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

