/**
 * API Route: Capturar orden de PayPal
 * POST /api/payments/paypal/capture-order
 * 
 * Captura el pago de PayPal y activa la suscripción premium
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PayPalCaptureOrderRequest, PayPalCaptureOrderResponse } from '@/types/subscriptions'

// Cliente de Supabase para API routes (servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

/**
 * Obtener token de acceso de PayPal
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Capturar pago en PayPal
 */
async function capturePayPalOrder(accessToken: string, orderId: string) {
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('PayPal capture failed:', error)
    throw new Error('Failed to capture PayPal order')
  }

  return await response.json()
}

/**
 * Obtener días según el período de facturación
 * Solo soporta planes Mensual (30 días) y Anual (365 días)
 */
function getDaysFromBillingPeriod(billingPeriod: string): number {
  switch (billingPeriod) {
    case 'monthly':
      return 30
    case 'yearly':
      return 365
    default:
      // Fallback por seguridad (no debería ocurrir)
      console.warn(`⚠️ [PayPal] Período de facturación no reconocido: ${billingPeriod}, usando 30 días por defecto`)
      return 30
  }
}

/**
 * Calcular fecha de fin sumando días restantes si existe membresía activa
 * @param billingPeriod - Período del nuevo plan
 * @param currentPremiumUntil - Fecha de expiración actual (si existe)
 * @returns Nueva fecha de expiración
 */
function calculateEndDate(billingPeriod: string, currentPremiumUntil?: string | null): Date {
  const now = new Date()
  const daysToAdd = getDaysFromBillingPeriod(billingPeriod)
  
  // Si existe una membresía activa (fecha futura), sumar días a esa fecha
  if (currentPremiumUntil) {
    const existingExpiry = new Date(currentPremiumUntil)
    
    // Solo sumar si la fecha es futura (membresía aún activa)
    if (existingExpiry > now) {
      const newDate = new Date(existingExpiry)
      newDate.setDate(newDate.getDate() + daysToAdd)
      console.log(`✅ [PayPal] Sumando ${daysToAdd} días a membresía existente. Antes: ${existingExpiry.toISOString()}, Después: ${newDate.toISOString()}`)
      return newDate
    }
  }
  
  // Si no hay membresía activa o ya expiró, empezar desde hoy
  const newDate = new Date(now)
  newDate.setDate(newDate.getDate() + daysToAdd)
  console.log(`✅ [PayPal] Creando nueva membresía de ${daysToAdd} días desde hoy: ${newDate.toISOString()}`)
  return newDate
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

    // Parsear body
    const body: PayPalCaptureOrderRequest = await request.json()
    const { orderId, paymentId } = body

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Obtener información del pago de nuestra DB
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, premium_plans(*)')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .eq('external_id', orderId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el pago no haya sido capturado ya
    if (payment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue completado' },
        { status: 400 }
      )
    }

    // Capturar pago en PayPal
    const accessToken = await getPayPalAccessToken()
    const captureResult = await capturePayPalOrder(accessToken, orderId)

    // Verificar que el capture fue exitoso
    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'El pago no fue completado en PayPal' },
        { status: 400 }
      )
    }

    // Actualizar pago a 'completed'
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        raw_payload: captureResult,
      })
      .eq('id', paymentId)

    if (updatePaymentError) {
      console.error('Error actualizando pago:', updatePaymentError)
    }

    // Obtener el negocio para verificar si tiene membresía activa
    const { data: business } = await supabase
      .from('businesses')
      .select('premium_until, is_premium')
      .eq('id', payment.business_id)
      .single()

    // Calcular fechas de la suscripción
    // Si existe premium_until y es futuro, se sumarán los días a esa fecha
    const startDate = new Date()
    const endDate = calculateEndDate(payment.premium_plans.billing_period, business?.premium_until)

    // Actualizar o crear suscripción
    const { data: existingSubscription } = await supabase
      .from('business_subscriptions')
      .select('id')
      .eq('business_id', payment.business_id)
      .eq('plan_id', payment.plan_id)
      .eq('status', 'pending')
      .single()

    if (existingSubscription) {
      // Actualizar suscripción existente
      await supabase
        .from('business_subscriptions')
        .update({
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', existingSubscription.id)
    } else {
      // Crear nueva suscripción
      await supabase
        .from('business_subscriptions')
        .insert({
          business_id: payment.business_id,
          user_id: user.id,
          plan_id: payment.plan_id,
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
        premium_plan_id: payment.plan_id,
      })
      .eq('id', payment.business_id)

    if (updateBusinessError) {
      console.error('Error activando premium en negocio:', updateBusinessError)
    }

    // Respuesta exitosa
    const response: PayPalCaptureOrderResponse = {
      success: true,
      subscriptionId: existingSubscription?.id,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error en capture-order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

