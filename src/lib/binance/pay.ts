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

import { createHmac, randomBytes, verify } from "crypto"

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

/* ── Verificación de webhooks entrantes ──────────────────────────────────────
 *
 * LO QUE HABÍA ACÁ ESTABA MAL, y de la peor forma posible: rechazaba TODOS los
 * webhooks reales. Calculaba un HMAC-SHA512 con NUESTRO secret y lo comparaba
 * con la cabecera de firma, que es lo mismo que se hace en las peticiones que
 * SALEN hacia Binance. Pero las que ENTRAN no van firmadas así: Binance las
 * firma con SHA256withRSA usando SU clave privada, y el comercio verifica con
 * la clave pública de Binance. Un HMAC y una firma RSA nunca van a coincidir.
 *
 * El efecto no era un agujero —fallaba cerrado— sino que el único camino por
 * el que un pago en Binance se convierte en membresía estaba tapiado: se
 * cobraba el cripto y no se acreditaba nada.
 *
 * Referencias:
 *   https://developers.binance.com/docs/binance-pay/webhook-common
 *   https://developers.binance.com/docs/binance-pay/webhook-query-certificate
 */

interface CertificadoBinance {
  certSerial?: string
  certPublic?: string
}

/* Las claves públicas de Binance cambian muy de vez en cuando, y pedirlas en
   cada webhook sería un viaje de red extra —firmado— por notificación. Se
   guardan por número de serie, que es lo que la cabecera Certificate-SN
   permite distinguir: si Binance rota la clave, llega un serial que no está
   en el mapa y se vuelve a pedir sola. */
const certificadosPorSerial = new Map<string, string>()

/** Envuelve la clave en PEM si Binance la devuelve pelada, en base64. */
function aPem(clave: string): string {
  const limpia = clave.trim()
  if (limpia.includes("-----BEGIN")) return limpia
  const cuerpo = limpia.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? limpia
  return `-----BEGIN PUBLIC KEY-----\n${cuerpo}\n-----END PUBLIC KEY-----`
}

async function obtenerClavePublica(serial: string): Promise<string | null> {
  const cacheada = certificadosPorSerial.get(serial)
  if (cacheada) return cacheada

  const { body } = await signedRequest<{ status?: string; data?: CertificadoBinance[] }>(
    "/binancepay/openapi/certificates",
    {}
  )

  if (body?.status !== "SUCCESS" || !body.data?.length) {
    console.error("[binance-pay] No se pudo obtener el certificado de Binance")
    return null
  }

  for (const cert of body.data) {
    if (cert.certSerial && cert.certPublic) {
      certificadosPorSerial.set(cert.certSerial, aPem(cert.certPublic))
    }
  }

  return certificadosPorSerial.get(serial) ?? null
}

/**
 * Verifica que un webhook entrante lo firmó Binance.
 *
 * `rawBody` tiene que ser el TEXTO tal como llegó, no un objeto re-serializado:
 * volver a pasar por JSON.stringify reordena claves y cambia espacios, y
 * cualquiera de las dos cosas rompe la firma.
 *
 * No se comprueba la frescura del timestamp a propósito. Binance reintenta las
 * notificaciones, a veces mucho después, y una ventana estrecha rechazaría
 * entregas legítimas. Reenviar un webhook válido ya no consigue nada: aplicar
 * dos veces el mismo pago suma cero meses desde que applyMembershipFromPayment
 * es idempotente de verdad.
 */
export async function verifyBinanceWebhookSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  signature: string,
  certificateSn: string
): Promise<boolean> {
  if (!timestamp || !nonce || !signature || !certificateSn) return false
  if (!isBinancePayConfigured()) return false

  try {
    const clavePublica = await obtenerClavePublica(certificateSn)
    if (!clavePublica) return false

    const payload = `${timestamp}\n${nonce}\n${rawBody}\n`

    return verify(
      "RSA-SHA256",
      Buffer.from(payload, "utf8"),
      clavePublica,
      Buffer.from(signature, "base64")
    )
  } catch (error) {
    // Si no se puede verificar, no se confía. Nunca al revés.
    console.error("[binance-pay] Error verificando la firma del webhook:", error)
    return false
  }
}
