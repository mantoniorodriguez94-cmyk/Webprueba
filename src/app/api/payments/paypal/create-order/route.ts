/**
 * API Route: Crear orden de PayPal
 * POST /api/payments/paypal/create-order
 * 
 * Crea una orden de pago en PayPal y registra el pago como 'pending'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { PayPalCreateOrderRequest, PayPalCreateOrderResponse } from '@/types/subscriptions'

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
 * Crear orden en PayPal
 */
async function createPayPalOrder(accessToken: string, amount: number, currency: string = 'USD') {
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Suscripción Premium - Encuentra',
        },
      ],
      application_context: {
        brand_name: 'Encuentra',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard/premium/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard/premium/cancel`,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('PayPal order creation failed:', error)
    throw new Error('Failed to create PayPal order')
  }

  return await response.json()
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
    const body: PayPalCreateOrderRequest = await request.json()
    const { plan_id, business_id } = body

    if (!plan_id || !business_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
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

    // Crear orden en PayPal
    const accessToken = await getPayPalAccessToken()
    const paypalOrder = await createPayPalOrder(accessToken, plan.price_usd)

    // Registrar pago en la base de datos como 'pending'
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        business_id,
        user_id: user.id,
        plan_id,
        method: 'paypal',
        amount_usd: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        external_id: paypalOrder.id,
        raw_payload: paypalOrder,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error registrando pago:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Error al registrar el pago' },
        { status: 500 }
      )
    }

    // Crear suscripción en estado 'pending'
    const { error: subscriptionError } = await supabase
      .from('business_subscriptions')
      .insert({
        business_id,
        user_id: user.id,
        plan_id,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(), // Se actualizará cuando se capture el pago
      })

    if (subscriptionError) {
      console.error('Error creando suscripción:', subscriptionError)
    }

    // Devolver respuesta con orderId de PayPal
    const response: PayPalCreateOrderResponse = {
      success: true,
      orderId: paypalOrder.id,
      paymentId: payment.id,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error en create-order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

