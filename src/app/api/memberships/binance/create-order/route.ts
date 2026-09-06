/**
 * API Route: Crear orden de Binance Pay para membresía
 * POST /api/memberships/binance/create-order
 *
 * Crea una orden en Binance Pay para el tier + meses solicitados, y guarda un
 * registro 'pending' en membership_payments (gateway: 'binance_pay') para que
 * el webhook pueda resolver userId/tier/months cuando Binance confirme el pago.
 */

import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/utils/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { createBinanceOrder, isBinancePayConfigured } from "@/lib/binance/pay"
import {
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
  calculateSubscriptionTotal,
  getLabelForTier,
} from "@/lib/memberships/tiers"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

const PAYABLE_TIERS: SubscriptionTier[] = [
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
]

interface CreateOrderBody {
  tier?: number
  months?: number
}

export async function POST(request: NextRequest) {
  try {
    if (!isBinancePayConfigured()) {
      return NextResponse.json(
        { success: false, error: "El pago con Binance Pay no está disponible todavía." },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as CreateOrderBody
    const tier = Number(body.tier)
    const months = Number(body.months) || 1

    if (!Number.isFinite(tier) || !PAYABLE_TIERS.includes(tier as SubscriptionTier)) {
      return NextResponse.json(
        { success: false, error: "Nivel de membresía inválido" },
        { status: 400 }
      )
    }

    if (!Number.isFinite(months) || months < 1) {
      return NextResponse.json({ success: false, error: "Duración inválida" }, { status: 400 })
    }

    const amountUsd = calculateSubscriptionTotal(tier, months)
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json(
        { success: false, error: "No se pudo calcular el monto de la membresía" },
        { status: 400 }
      )
    }

    const merchantTradeNo = `AE${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 12)}`.slice(0, 32)
    const tierLabel = getLabelForTier(tier as SubscriptionTier)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://appencuentra.com"

    // 1) Registrar la orden como 'pending' ANTES de llamar a Binance, para que
    //    el webhook pueda resolver user_id/tier/months por merchantTradeNo.
    const adminSupabase = getAdminClient()
    const { error: insertError } = await (adminSupabase as any).from("membership_payments").insert({
      user_id: user.id,
      amount: amountUsd,
      currency: "USD",
      gateway: "binance_pay",
      transaction_ref: merchantTradeNo,
      status: "pending",
      target_tier: tier,
      months,
    })

    if (insertError) {
      console.error("[binance/create-order] Error registrando orden pendiente:", insertError)
      return NextResponse.json(
        { success: false, error: "No se pudo iniciar el pago. Intenta nuevamente." },
        { status: 500 }
      )
    }

    // 2) Crear la orden en Binance Pay
    const order = await createBinanceOrder({
      merchantTradeNo,
      amountUsd,
      description: `Membresía App Encuentra — ${tierLabel} (${months} ${months === 1 ? "mes" : "meses"})`,
      returnUrl: `${appUrl}/app/dashboard/membresia?binance=success`,
      cancelUrl: `${appUrl}/app/dashboard/membresia?binance=cancel`,
      webhookUrl: `${appUrl}/api/memberships/binance/webhook`,
    })

    if (!order.success || !order.checkoutUrl) {
      // Marcar la orden pendiente como fallida para no dejarla huérfana
      await (adminSupabase as any)
        .from("membership_payments")
        .update({ status: "failed" })
        .eq("gateway", "binance_pay")
        .eq("transaction_ref", merchantTradeNo)

      return NextResponse.json(
        { success: false, error: order.error || "No se pudo crear la orden en Binance Pay" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: order.checkoutUrl,
      qrcodeLink: order.qrcodeLink,
      merchantTradeNo,
    })
  } catch (error: any) {
    console.error("[binance/create-order] Error:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
