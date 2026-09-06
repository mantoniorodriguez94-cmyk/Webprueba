// src/lib/binance/pay.ts
// ---------------------------------------------
// Cliente mínimo para la Binance Pay Merchant API (Create Order + firma).
//
// Referencia: https://developers.binance.com/docs/binance-pay
// Firma: HMAC-SHA512(timestamp + "\n" + nonce + "\n" + body + "\n", secretKey), hex mayúsculas.
//
// Requiere las variables de entorno:
//   BINANCE_PAY_API_KEY     (Certificate SN del merchant)
//   BINANCE_PAY_SECRET_KEY

import { createHmac, randomBytes } from "crypto"

const BINANCE_PAY_API_BASE = "https://bpay.binanceapi.com"

export function isBinancePayConfigured(): boolean {
  return Boolean(process.env.BINANCE_PAY_API_KEY && process.env.BINANCE_PAY_SECRET_KEY)
}

function generateNonce(): string {
  return randomBytes(16).toString("hex").toUpperCase().slice(0, 32)
}

function sign(payload: string, secretKey: string): string {
  return createHmac("sha512", secretKey).update(payload).digest("hex").toUpperCase()
}

interface BinancePaySignedRequestResult<T> {
  status: number
  body: T | null
  raw: string
}

/**
 * Envía una request firmada a la Binance Pay Merchant API.
 * Lanza si las credenciales no están configuradas — el caller debe chequear
 * `isBinancePayConfigured()` antes para dar un mensaje amigable al usuario.
 */
async function signedRequest<T>(path: string, body: Record<string, unknown>): Promise<BinancePaySignedRequestResult<T>> {
  const apiKey = process.env.BINANCE_PAY_API_KEY
  const secretKey = process.env.BINANCE_PAY_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error("Binance Pay no está configurado (faltan BINANCE_PAY_API_KEY / BINANCE_PAY_SECRET_KEY).")
  }

  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const jsonBody = JSON.stringify(body)
  const payload = `${timestamp}\n${nonce}\n${jsonBody}\n`
  const signature = sign(payload, secretKey)

  const response = await fetch(`${BINANCE_PAY_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": apiKey,
      "BinancePay-Signature": signature,
    },
    body: jsonBody,
  })

  const raw = await response.text()
  let parsed: T | null = null
  try {
    parsed = raw ? (JSON.parse(raw) as T) : null
  } catch {
    parsed = null
  }

  return { status: response.status, body: parsed, raw }
}

export interface CreateBinanceOrderInput {
  /** Identificador único nuestro para la orden (<=32 chars, alfanumérico). */
  merchantTradeNo: string
  /** Monto en USD — Binance Pay lo convierte a cripto automáticamente (fiatAmount). */
  amountUsd: number
  /** Descripción corta mostrada en el checkout de Binance. */
  description: string
  returnUrl?: string
  cancelUrl?: string
  webhookUrl?: string
}

export interface CreateBinanceOrderResult {
  success: boolean
  error?: string
  prepayId?: string
  checkoutUrl?: string
  qrcodeLink?: string
  deeplink?: string
}

interface BinanceOrderApiResponse {
  status?: string
  code?: string
  errorMessage?: string
  data?: {
    prepayId?: string
    checkoutUrl?: string
    qrcodeLink?: string
    deeplink?: string
  }
}

export async function createBinanceOrder(
  input: CreateBinanceOrderInput
): Promise<CreateBinanceOrderResult> {
  try {
    const body: Record<string, unknown> = {
      env: { terminalType: "WEB" },
      merchantTradeNo: input.merchantTradeNo,
      fiatAmount: input.amountUsd,
      fiatCurrency: "USD",
      orderExpireTime: Date.now() + 60 * 60 * 1000, // 1 hora
      description: input.description,
      goodsDetails: [
        {
          goodsType: "02", // virtual
          goodsCategory: "Z000", // otros / servicios digitales
          referenceGoodsId: input.merchantTradeNo,
          goodsName: input.description,
        },
      ],
    }

    if (input.returnUrl) body.returnUrl = input.returnUrl
    if (input.cancelUrl) body.cancelUrl = input.cancelUrl
    if (input.webhookUrl) body.webhookUrl = input.webhookUrl

    const { body: result } = await signedRequest<BinanceOrderApiResponse>(
      "/binancepay/openapi/v3/order",
      body
    )

    if (!result || result.status !== "SUCCESS" || !result.data?.checkoutUrl) {
      return {
        success: false,
        error: result?.errorMessage || "Binance Pay no devolvió una orden válida.",
      }
    }

    return {
      success: true,
      prepayId: result.data.prepayId,
      checkoutUrl: result.data.checkoutUrl,
      qrcodeLink: result.data.qrcodeLink,
      deeplink: result.data.deeplink,
    }
  } catch (error: any) {
    console.error("[binance-pay] createBinanceOrder error:", error)
    return { success: false, error: error?.message || "Error creando la orden en Binance Pay" }
  }
}

/**
 * Verifica la firma de un webhook entrante de Binance Pay.
 * Binance envía los mismos headers (Timestamp/Nonce/Signature) que en las
 * requests salientes, firmando timestamp+"\n"+nonce+"\n"+rawBody+"\n" con
 * nuestro Secret Key.
 */
export function verifyBinanceWebhookSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  signature: string
): boolean {
  const secretKey = process.env.BINANCE_PAY_SECRET_KEY
  if (!secretKey) return false

  const payload = `${timestamp}\n${nonce}\n${rawBody}\n`
  const expected = sign(payload, secretKey)

  // Comparación en tiempo constante para evitar timing attacks
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}
