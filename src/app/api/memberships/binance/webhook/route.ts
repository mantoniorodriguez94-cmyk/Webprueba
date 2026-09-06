/**
 * API Route: Webhook de Binance Pay
 * POST /api/memberships/binance/webhook
 *
 * Recibe la notificación de pago de Binance, verifica la firma, y si el pago
 * fue exitoso activa la membresía por el MISMO camino compartido que usan
 * PayPal y la aprobación manual:
 *   applyMembershipFromPayment() + applyTierBenefitsToBusinesses()
 *
 * Binance exige una respuesta { returnCode: "SUCCESS", returnMessage: null }
 * para no reintentar la notificación.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { verifyBinanceWebhookSignature } from "@/lib/binance/pay"
import { applyMembershipFromPayment, applyTierBenefitsToBusinesses } from "@/lib/memberships/service"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

const ACK_SUCCESS = { returnCode: "SUCCESS", returnMessage: null }

interface BinanceWebhookBody {
  bizType?: string
  bizId?: string
  bizStatus?: string
  data?: string // JSON string con los detalles de la orden
}

interface BinanceOrderNotification {
  merchantTradeNo?: string
  prepayId?: string
  transactionId?: string
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const timestamp = request.headers.get("BinancePay-Timestamp") || ""
  const nonce = request.headers.get("BinancePay-Nonce") || ""
  const signature = request.headers.get("BinancePay-Signature") || ""

  if (!verifyBinanceWebhookSignature(timestamp, nonce, rawBody, signature)) {
    console.error("[binance/webhook] Firma inválida — posible request falsificado")
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid signature" }, { status: 401 })
  }

  let payload: BinanceWebhookBody
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid body" }, { status: 400 })
  }

  // Solo nos interesa la confirmación de pago exitoso
  if (payload.bizType !== "PAY" || payload.bizStatus !== "PAY_SUCCESS") {
    // Reconocer igual (p.ej. PAY_CLOSED) para que Binance no reintente
    return NextResponse.json(ACK_SUCCESS)
  }

  let orderData: BinanceOrderNotification = {}
  try {
    orderData = payload.data ? JSON.parse(payload.data) : {}
  } catch {
    console.error("[binance/webhook] No se pudo parsear 'data' del webhook")
    return NextResponse.json(ACK_SUCCESS) // Ack de todos modos, ya se logueó
  }

  const merchantTradeNo = orderData.merchantTradeNo
  if (!merchantTradeNo) {
    console.error("[binance/webhook] Webhook sin merchantTradeNo:", payload)
    return NextResponse.json(ACK_SUCCESS)
  }

  try {
    const adminSupabase = getAdminClient()

    // Buscar la orden 'pending' que registramos en create-order
    const { data: pendingOrder, error: fetchError } = await (adminSupabase as any)
      .from("membership_payments")
      .select("user_id, amount, target_tier, months, status")
      .eq("gateway", "binance_pay")
      .eq("transaction_ref", merchantTradeNo)
      .single()

    if (fetchError || !pendingOrder) {
      console.error("[binance/webhook] Orden no encontrada:", merchantTradeNo, fetchError)
      return NextResponse.json(ACK_SUCCESS) // No reintentar; no hay nada que hacer con esto
    }

    // Idempotencia: si ya se aplicó, no repetir (applyMembershipFromPayment ya
    // es idempotente por transaction_ref, pero evitamos trabajo de más)
    if (pendingOrder.status === "completed") {
      return NextResponse.json(ACK_SUCCESS)
    }

    const targetTier = Number(pendingOrder.target_tier) as SubscriptionTier
    const months = Number(pendingOrder.months) || 1
    const amount = Number(pendingOrder.amount)

    const result = await applyMembershipFromPayment({
      userId: pendingOrder.user_id,
      amount,
      currency: "USD",
      gateway: "binance_pay",
      transactionRef: merchantTradeNo,
      targetTier,
      monthsToAdd: months,
    })

    if (!result.success) {
      console.error("[binance/webhook] Error aplicando membresía:", result.error)
      // No devolvemos error a Binance por esto — el pago ya ocurrió de su lado.
      // Queda registrado en logs para revisión manual.
      return NextResponse.json(ACK_SUCCESS)
    }

    await applyTierBenefitsToBusinesses(pendingOrder.user_id, result.tier ?? targetTier)

    return NextResponse.json(ACK_SUCCESS)
  } catch (error: any) {
    console.error("[binance/webhook] Error inesperado:", error)
    // Aun así reconocemos para que Binance no reintente indefinidamente;
    // el error queda en logs para revisión manual.
    return NextResponse.json(ACK_SUCCESS)
  }
}
