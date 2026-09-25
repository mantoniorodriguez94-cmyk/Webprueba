/**
 * API Route: Webhook de PayPal para membresías
 * POST /api/memberships/paypal/webhook
 *
 * POR QUÉ EXISTE. Hasta ahora la membresía sólo se aplicaba en capture-order,
 * que corre en el NAVEGADOR de quien paga: se vuelve de PayPal, el cliente
 * llama a esa ruta y ahí se cobra y se acredita. Si esa vuelta no ocurre, no
 * pasa nada más, y hay un caso en el que eso sí cuesta dinero: la captura en
 * PayPal SÍ se completa —el dinero se mueve— y después falla la escritura en
 * la base, o se corta la conexión antes de que la respuesta llegue. Queda el
 * pago cobrado y la membresía sin aplicar, en silencio y sin nadie mirando.
 *
 * El webhook llega por su cuenta, desde PayPal a nuestro servidor, sin pasar
 * por el navegador de nadie. Es el único camino que sigue existiendo cuando el
 * otro se rompe.
 *
 * Requiere PAYPAL_WEBHOOK_ID (el id del webhook creado en el panel de PayPal).
 * Sin esa variable la ruta RECHAZA todo: un endpoint que aplica membresías sin
 * comprobar quién lo llama es una forma de regalar planes a cualquiera que
 * sepa la URL.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import {
  applyMembershipFromPayment,
  applyTierBenefitsToBusinesses,
} from "@/lib/memberships/service"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

const PAYPAL_API_BASE = "https://api-m.paypal.com"

/* A PayPal se le contesta 200 en casi todo. Un 5xx le hace reintentar durante
   días, y reintentar no arregla ninguno de nuestros errores: si la orden no
   está en la base o el evento no nos interesa, va a seguir sin estarlo en el
   siguiente intento. Los fallos quedan en el log. La única excepción es la
   firma inválida, que sí se rechaza. */
const ACK = NextResponse.json({ received: true })

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_SECRET_KEY || process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.status}`)
  }

  return (await response.json()).access_token
}

/**
 * Le pregunta a PayPal si el evento lo firmó PayPal.
 *
 * Se manda el cuerpo YA PARSEADO, no el texto: así lo pide su API de
 * verificación, que vuelve a serializarlo de su lado.
 */
async function firmaValida(request: NextRequest, evento: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error(
      "[paypal/webhook] PAYPAL_WEBHOOK_ID no configurado — se rechaza el evento. " +
        "Crear el webhook en el panel de PayPal y copiar su id a las variables de entorno."
    )
    return false
  }

  const h = (nombre: string) => request.headers.get(nombre) || ""
  const cabeceras = {
    auth_algo: h("paypal-auth-algo"),
    cert_url: h("paypal-cert-url"),
    transmission_id: h("paypal-transmission-id"),
    transmission_sig: h("paypal-transmission-sig"),
    transmission_time: h("paypal-transmission-time"),
  }

  if (Object.values(cabeceras).some((v) => !v)) {
    console.error("[paypal/webhook] Faltan cabeceras de firma")
    return false
  }

  try {
    const accessToken = await getPayPalAccessToken()
    const respuesta = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...cabeceras, webhook_id: webhookId, webhook_event: evento }),
      }
    )

    if (!respuesta.ok) {
      console.error("[paypal/webhook] Verificación de firma falló:", respuesta.status)
      return false
    }

    return (await respuesta.json())?.verification_status === "SUCCESS"
  } catch (error) {
    // Si no se puede verificar, no se confía. Nunca al revés.
    console.error("[paypal/webhook] Error verificando la firma:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  let evento: any
  try {
    evento = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  if (!(await firmaValida(request, evento))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
  }

  try {
    // El dinero se mueve de verdad en este evento. CHECKOUT.ORDER.APPROVED es
    // sólo que la persona dijo que sí, y con intent CAPTURE eso todavía no
    // cobra nada: acreditar ahí regalaría la membresía.
    if (evento?.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      return ACK
    }

    const orderId: string | undefined =
      evento?.resource?.supplementary_data?.related_ids?.order_id

    if (!orderId) {
      console.error("[paypal/webhook] Evento sin order_id:", evento?.id)
      return ACK
    }

    /* La orden pendiente la dejó create-order con el tier y los meses EXACTOS.
       Se leen de ahí y no del monto del evento porque resolver por monto es
       ambiguo: el total con descuento de 12 meses coincide con el de 10 sin
       descuento. Mismo motivo por el que capture-order también los lee. */
    const adminSupabase = getAdminClient()
    const { data: orden, error: errorOrden } = await (adminSupabase as any)
      .from("membership_payments")
      .select("user_id, amount, target_tier, months, status")
      .eq("gateway", "paypal")
      .eq("transaction_ref", orderId)
      .maybeSingle()

    if (errorOrden || !orden) {
      console.error("[paypal/webhook] Orden no encontrada:", orderId, errorOrden)
      return ACK
    }

    // El caso corriente y sano: el navegador volvió, capture-order ya acreditó
    // y el webhook sólo confirma lo que ya sabíamos.
    if (orden.status === "completed") {
      return ACK
    }

    const targetTier = Number(orden.target_tier) as SubscriptionTier
    const resultado = await applyMembershipFromPayment({
      userId: orden.user_id,
      amount: Number(orden.amount),
      currency: "USD",
      gateway: "paypal",
      transactionRef: orderId,
      targetTier,
      monthsToAdd: Number(orden.months) || 1,
    })

    if (!resultado.success) {
      console.error("[paypal/webhook] Error aplicando membresía:", orderId, resultado.error)
      return ACK
    }

    await applyTierBenefitsToBusinesses(orden.user_id, resultado.tier ?? targetTier)

    console.log(
      `[paypal/webhook] Membresía aplicada por webhook (el navegador no volvió): ${orderId}`
    )
    return ACK
  } catch (error) {
    console.error("[paypal/webhook] Error inesperado:", error)
    return ACK
  }
}
