/**
 * API Route: Capturar orden de PayPal para membresía
 * POST /api/memberships/paypal/capture-order
 *
 * Captura una orden de PayPal y aplica la membresía al usuario autenticado.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { applyMembershipFromPayment } from "@/lib/memberships/service"
import { resolveSubscriptionFromAmount } from "@/lib/memberships/tiers"

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

interface CaptureOrderBody {
  orderId?: string
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    console.error("[membership/paypal] Error getting access token:", response.status, text)
    throw new Error("Failed to get PayPal access token")
  }

  const data = await response.json()
  return data.access_token
}

async function capturePayPalOrder(accessToken: string, orderId: string) {
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    console.error("[membership/paypal] Order capture failed:", error || response.statusText)
    throw new Error("Failed to capture PayPal order")
  }

  return await response.json()
}

function extractCaptureAmount(captureResult: any): { amount: number; currency: string } | null {
  try {
    const purchaseUnit = captureResult?.purchase_units?.[0]
    const capture = purchaseUnit?.payments?.captures?.[0]
    const valueStr = capture?.amount?.value
    const currency = capture?.amount?.currency_code

    if (!valueStr || !currency) {
      return null
    }

    const amountNum = Number(valueStr)
    if (!Number.isFinite(amountNum)) {
      return null
    }

    return { amount: amountNum, currency }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar usuario autenticado
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as CaptureOrderBody
    const orderId = body.orderId

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId es requerido" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const captureResult = await capturePayPalOrder(accessToken, orderId)

    if (captureResult?.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "El pago no fue completado en PayPal" },
        { status: 400 }
      )
    }

    const extracted = extractCaptureAmount(captureResult)

    if (!extracted) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo determinar el monto de la transacción"
        },
        { status: 400 }
      )
    }

    const { amount, currency } = extracted

    if (currency !== "USD") {
      return NextResponse.json(
        { success: false, error: "Moneda inválida para membresía" },
        { status: 400 }
      )
    }

    // Resolver tier + meses desde el monto
    const subInfo = resolveSubscriptionFromAmount(amount)
    if (!subInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "El monto capturado no coincide con ningún plan de suscripción válido"
        },
        { status: 400 }
      )
    }

    // Aplicar suscripción en la base de datos
    const result = await applyMembershipFromPayment({
      userId: user.id,
      amount,
      currency: "USD",
      gateway: "paypal",
      transactionRef: orderId,
      targetTier: subInfo.tier,
      monthsToAdd: subInfo.months
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error aplicando membresía"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tier: result.tier,
      months: result.monthsAdded,
      amount
    })
  } catch (error: any) {
    console.error("[membership/paypal/capture-order] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error interno del servidor"
      },
      { status: 500 }
    )
  }
}


