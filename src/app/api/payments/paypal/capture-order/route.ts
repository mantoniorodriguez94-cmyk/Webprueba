/**
 * API Route: Capturar orden de PayPal
 * POST /api/payments/paypal/capture-order
 * 
 * Captura el pago de PayPal y activa la suscripción premium
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { PayPalCaptureOrderRequest, PayPalCaptureOrderResponse } from '@/types/subscriptions'

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
    // Crear cliente de Supabase admin
    const supabase = createAdminClient()
    
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

    // Calcular fechas de la suscripción
    const startDate = new Date()
    const endDate = calculateEndDate(payment.premium_plans.billing_period)

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

