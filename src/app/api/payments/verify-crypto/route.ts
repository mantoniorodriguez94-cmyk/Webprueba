/**
 * API Route: Verificar pago Crypto USDT (TRC-20) para membresía de usuario
 * POST /api/payments/verify-crypto
 *
 * Flujo:
 *  - Recibe { txid }
 *  - Comprueba que el txid no haya sido usado ya en membership_payments
 *  - Llama a TronGrid para obtener detalles de la transacción
 *  - Verifica:
 *      - Dirección destino = dirección de depósito (Kraken) configurada
 *      - contract_address = contrato oficial USDT TRC-20
 *      - amount > 0, convierte de 6 decimales a unidades normales
 *  - Aplica membresía usando applyMembershipFromPayment()
 *
 * Soporta modo mock para pruebas: CRYPTO_VERIFY_MODE=mock
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { applyMembershipFromPayment } from "@/lib/memberships/service"
import { calculateSubscriptionTotal, isApproximately } from "@/lib/memberships/tiers"

interface VerifyCryptoBody {
  txid?: string
  tier?: number
  months?: number
}

const DEFAULT_TRON_API_BASE = "https://api.trongrid.io"
const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"

function normalizeAddress(addr: string | null | undefined): string | null {
  if (!addr || typeof addr !== "string") return null
  return addr.trim()
}

export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json().catch(() => ({}))) as VerifyCryptoBody
    const txid = body.txid?.trim()
    const bodyTier = typeof body.tier === "number" ? body.tier : undefined
    const bodyMonths = typeof body.months === "number" ? body.months : undefined

    if (!txid) {
      return NextResponse.json(
        { success: false, error: "txid es requerido" },
        { status: 400 }
      )
    }

    const adminSupabase = getAdminClient()

    // 1) Idempotencia: verificar si el txid ya existe en membership_payments
    const { data: existing, error: existingError } = await adminSupabase
      .from("membership_payments")
      .select("id")
      .eq("gateway", "crypto_trc20")
      .eq("transaction_ref", txid)
      .maybeSingle()

    if (existingError && existingError.code !== "PGRST116") {
      console.error("[crypto] Error comprobando txid existente:", existingError)
      return NextResponse.json(
        { success: false, error: "Error comprobando transacción" },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Esta transacción ya fue utilizada" },
        { status: 400 }
      )
    }

    // 2) Modo mock para pruebas de interfaz sin transacción real
    if (process.env.CRYPTO_VERIFY_MODE === "mock") {
      const tierForMock = (bodyTier ?? 3) as any
      const monthsForMock = bodyMonths && bodyMonths > 0 ? bodyMonths : 1
      const mockAmount = calculateSubscriptionTotal(tierForMock, monthsForMock)

      const result = await applyMembershipFromPayment({
        userId: user.id,
        amount: mockAmount,
        currency: "USDT",
        gateway: "crypto_trc20",
        transactionRef: txid,
        targetTier: tierForMock,
        monthsToAdd: monthsForMock
      })

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Error aplicando suscripción (mock)"
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mode: "mock",
        tier: result.tier,
        months: result.monthsAdded,
        amount: mockAmount
      })
    }

    // 3) Modo real: llamar a TronGrid
    const tronApiBase = process.env.TRON_API_BASE || DEFAULT_TRON_API_BASE
    const tronUrl = `${tronApiBase.replace(/\/+$/, "")}/v1/transactions/${encodeURIComponent(txid)}`

    const headers: Record<string, string> = {
      Accept: "application/json"
    }

    const tronApiKey = process.env.TRON_API_KEY || process.env.TRONGRID_API_KEY
    if (tronApiKey) {
      headers["TRON-PRO-API-KEY"] = tronApiKey
    }

    const tronResponse = await fetch(tronUrl, { headers })

    if (!tronResponse.ok) {
      const text = await tronResponse.text().catch(() => "")
      console.error("[crypto] TronGrid error:", tronResponse.status, text)
      return NextResponse.json(
        { success: false, error: "No se pudo obtener la transacción desde TronGrid" },
        { status: 502 }
      )
    }

    const tronData = await tronResponse.json().catch(() => null)

    const tx = tronData?.data?.[0]
    const contract = tx?.raw_data?.contract?.[0]
    const value = contract?.parameter?.value

    const toAddress = normalizeAddress(value?.to_address)
    const contractAddress = normalizeAddress(value?.contract_address)
    const amountRaw = value?.amount

    if (!toAddress || !contractAddress || typeof amountRaw !== "number") {
      console.error("[crypto] Transacción TRC-20 inválida o sin datos esperados:", tronData)
      return NextResponse.json(
        {
          success: false,
          error:
            "La transacción no parece ser una transferencia TRC-20 válida o está incompleta"
        },
        { status: 400 }
      )
    }

    // 4) Verificar dirección destino y contrato USDT
    const depositAddress =
      normalizeAddress(process.env.NEXT_PUBLIC_CRYPTO_DEPOSIT_ADDRESS) ||
      normalizeAddress(process.env.CRYPTO_DEPOSIT_ADDRESS)

    if (!depositAddress) {
      console.error("[crypto] Dirección de depósito no configurada")
      return NextResponse.json(
        { success: false, error: "Dirección de depósito no configurada en el servidor" },
        { status: 500 }
      )
    }

    if (toAddress !== depositAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "La transacción no fue enviada a la dirección de depósito esperada"
        },
        { status: 400 }
      )
    }

    if (contractAddress !== USDT_TRC20_CONTRACT) {
      return NextResponse.json(
        {
          success: false,
          error: "El contrato de la transacción no corresponde a USDT TRC-20"
        },
        { status: 400 }
      )
    }

    // 5) Convertir monto (USDT tiene 6 decimales)
    const amount = Number((amountRaw / 1_000_000).toFixed(2))
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Monto de la transacción inválido" },
        { status: 400 }
      )
    }

    // 6) Determinar tier y meses esperados según body (si se envían)
    let targetTier = bodyTier as any
    let monthsToAdd = bodyMonths && bodyMonths > 0 ? bodyMonths : 1

    if (!targetTier) {
      return NextResponse.json(
        { success: false, error: "Debe especificar el tier de suscripción (tier)" },
        { status: 400 }
      )
    }

    const expectedTotal = calculateSubscriptionTotal(targetTier, monthsToAdd)
    if (!Number.isFinite(expectedTotal) || expectedTotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Tier de suscripción inválido" },
        { status: 400 }
      )
    }
    if (!isApproximately(amount, expectedTotal)) {
      return NextResponse.json(
        {
          success: false,
          error: "El monto de la transacción no coincide con el plan seleccionado"
        },
        { status: 400 }
      )
    }

    // 7) Aplicar suscripción
    const result = await applyMembershipFromPayment({
      userId: user.id,
      amount,
      currency: "USDT",
      gateway: "crypto_trc20",
      transactionRef: txid,
      targetTier,
      monthsToAdd
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
    console.error("[crypto/verify-crypto] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error interno del servidor"
      },
      { status: 500 }
    )
  }
}


