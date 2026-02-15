/**
 * API Route: Crear orden de PayPal para membresía de usuario
 * POST /api/memberships/paypal/create-order
 *
 * Crea una orden de PayPal (intent: CAPTURE) para el usuario autenticado,
 * usando un monto directo o un tier predefinido.
 *
 * NOTA: Esta ruta es independiente del sistema de pagos de negocios premium.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { calculateSubscriptionTotal } from "@/lib/memberships/tiers"
import { getPriceForTier } from "@/lib/memberships/tiers"

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

interface CreateOrderBody {
  amount?: number
  tier?: number
  months?: number
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

async function createPayPalOrder(accessToken: string, amount: number, currency: string = "USD") {
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          description: "Membresía - Portal Encuentra"
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    console.error("[membership/paypal] Order creation failed:", error || response.statusText)
    throw new Error("Failed to create PayPal order")
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    // Verificar usuario autenticado (via cookies)
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

    const body = (await request.json().catch(() => ({}))) as CreateOrderBody
    const { amount, tier, months } = body

    let finalAmount: number | null = null

    if (typeof tier === "number") {
      const monthsToUse = months && months > 0 ? months : 1
      const total = calculateSubscriptionTotal(tier, monthsToUse)
      if (!Number.isFinite(total) || total <= 0) {
        return NextResponse.json(
          { success: false, error: "Tier o duración inválidos" },
          { status: 400 }
        )
      }
      finalAmount = total
    } else if (typeof amount === "number") {
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { success: false, error: "Monto inválido" },
          { status: 400 }
        )
      }
      finalAmount = Number(amount.toFixed(2))
    } else {
      return NextResponse.json(
        { success: false, error: "Debe especificar amount o tier" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const order = await createPayPalOrder(accessToken, finalAmount)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: finalAmount
    })
  } catch (error: any) {
    console.error("[membership/paypal/create-order] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error interno del servidor"
      },
      { status: 500 }
    )
  }
}


