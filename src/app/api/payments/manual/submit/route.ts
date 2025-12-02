/**
 * API Route: Enviar pago manual para verificación
 * POST /api/payments/manual/submit
 * 
 * Registra un pago manual con captura de pantalla para verificación del admin
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

    // Parsear FormData (incluye archivo)
    const formData = await request.formData()
    const plan_id = formData.get('plan_id') as string
    const business_id = formData.get('business_id') as string
    const payment_method = formData.get('payment_method') as string
    const reference = formData.get('reference') as string
    const screenshot = formData.get('screenshot') as File

    // Validar campos requeridos
    if (!plan_id || !business_id || !payment_method || !screenshot) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el negocio pertenece al usuario
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id, name')
      .eq('id', business_id)
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Obtener información del plan
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Subir captura a Supabase Storage
    const timestamp = Date.now()
    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${user.id}/${business_id}/${timestamp}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_receipts')
      .upload(fileName, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error subiendo captura:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Error al subir la captura de pantalla' },
        { status: 500 }
      )
    }

    // Obtener URL pública de la captura
    const { data: { publicUrl } } = supabase.storage
      .from('payment_receipts')
      .getPublicUrl(fileName)

    // Registrar pago manual para verificación
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .insert({
        business_id,
        user_id: user.id,
        plan_id,
        amount_usd: plan.price_usd,
        payment_method,
        reference: reference || null,
        screenshot_url: publicUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error registrando pago manual:', submissionError)
      return NextResponse.json(
        { success: false, error: 'Error al registrar el pago manual' },
        { status: 500 }
      )
    }

    // Registrar en la tabla payments también
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        business_id,
        user_id: user.id,
        plan_id,
        method: 'manual',
        amount_usd: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        external_id: submission.id, // Referencia al submission
      })

    if (paymentError) {
      console.error('Error registrando pago en tabla payments:', paymentError)
    }

    return NextResponse.json({
      success: true,
      data: {
        submission_id: submission.id,
        status: 'pending',
        message: 'Tu pago ha sido enviado para verificación. Te notificaremos cuando sea aprobado.',
      },
    })

  } catch (error: any) {
    console.error('Error en submit manual payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

