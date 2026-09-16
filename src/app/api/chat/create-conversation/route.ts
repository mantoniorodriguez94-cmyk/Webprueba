/**
 * POST /api/chat/create-conversation
 *
 * Creates or finds an existing conversation between the authenticated sender
 * and the target business, then inserts the first message.
 *
 * Server-side gate: sólo el NEGOCIO necesita membresía activa (tier >= 1).
 * El chat es el beneficio que compra el negocio; quien escribe únicamente
 * tiene que estar autenticado. La comprobación vive también acá y no sólo en
 * la pantalla porque a esta ruta se la puede llamar directamente.
 *
 * Returns { conversationId: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendChatNotificationEmail } from "@/lib/emails"
import { isTierActive } from "@/lib/memberships/tiers"

/** A cuántos negocios distintos puede escribirle una persona por hora.
 *  Alguien pidiendo presupuestos contacta cinco o seis; nadie legítimo pasa
 *  de diez. Subirlo o bajarlo es cambiar este número. */
const MAX_NEGOCIOS_NUEVOS_POR_HORA = 10

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { businessId, initialMessage } = body as {
      businessId?: string
      initialMessage?: string
    }

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json(
        { error: "businessId es requerido." },
        { status: 400 }
      )
    }

    if (!initialMessage || typeof initialMessage !== "string" || !initialMessage.trim()) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      )
    }

    // ── 1. Authenticate sender ────────────────────────────────────────────────
    const userClient = await createClient()
    const {
      data: { user: sender },
      error: authErr,
    } = await userClient.auth.getUser()

    if (authErr || !sender) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para enviar mensajes." },
        { status: 401 }
      )
    }

    // ── 2. Fetch business ────────────────────────────────────────────────────
    const supabase = createAdminClient()

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, owner_id, name")
      .eq("id", businessId)
      .single()

    if (bizErr || !business) {
      return NextResponse.json(
        { error: "Negocio no encontrado." },
        { status: 404 }
      )
    }

    // Prevent a business owner from messaging their own business
    if (business.owner_id === sender.id) {
      return NextResponse.json(
        { error: "No puedes enviarte mensajes a ti mismo." },
        { status: 400 }
      )
    }

    /* ── 2b. El chat lo paga el negocio, no el cliente ────────────────────────
       Antes esto exigía membresía activa en LOS DOS lados, y ahí el chat
       estaba muerto: las personas se registran como clientes, nunca compran un
       plan de negocio, así que ningún cliente podía escribirle a nadie. Un
       negocio pagaba Conecta —cuyo beneficio estrella es justamente el chat—
       y no le llegaba un solo mensaje.

       El cliente sólo tiene que estar autenticado, y eso se comprueba arriba:
       sin cuenta no hay a quién responderle. */
    const { data: ownerProfile } = business.owner_id
      ? await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date")
          .eq("id", business.owner_id)
          .maybeSingle()
      : { data: null }

    const ownerTier = (ownerProfile as any)?.subscription_tier ?? 0
    const ownerEndDate = (ownerProfile as any)?.subscription_end_date ?? null

    if (!isTierActive(ownerTier, ownerEndDate)) {
      return NextResponse.json(
        { error: "Este negocio no tiene una membresía activa para recibir mensajes." },
        { status: 403 }
      )
    }

    // ── 3. Find or create conversation ───────────────────────────────────────
    let conversationId: string

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", sender.id)
      .maybeSingle()

    if (existing?.id) {
      conversationId = existing.id
    } else {
      /* Tope de negocios nuevos por hora.
         Va sólo en esta rama —la de crear— porque seguir una conversación ya
         abierta no es spam: escribirle diez veces a una panadería es pesado,
         escribirle a cien negocios en una hora es un bot.

         Como `conversations` tiene UNIQUE(business_id, user_id), contar
         conversaciones creadas equivale a contar a cuántos negocios DISTINTOS
         ha escrito la persona, que es justo la señal que importa.

         El contador vive en la base y no en memoria del proceso: en Vercel
         cada petición puede caer en una instancia distinta, y una variable
         local no contaría nada. */
      const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: nuevasEstaHora } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", sender.id)
        .gte("created_at", haceUnaHora)

      if ((nuevasEstaHora ?? 0) >= MAX_NEGOCIOS_NUEVOS_POR_HORA) {
        return NextResponse.json(
          {
            error: `Has contactado ${MAX_NEGOCIOS_NUEVOS_POR_HORA} negocios en la última hora. Espera un rato antes de escribir a otro.`,
          },
          { status: 429 }
        )
      }

      const { data: created, error: createErr } = await supabase
        .from("conversations")
        .insert({ business_id: businessId, user_id: sender.id })
        .select("id")
        .single()

      if (createErr || !created) {
        console.error("[chat/create-conversation] Error creating conversation:", createErr)
        return NextResponse.json(
          { error: "No se pudo crear la conversación." },
          { status: 500 }
        )
      }

      conversationId = created.id
    }

    // ── 5. Insert first message ───────────────────────────────────────────────
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: sender.id,
      content: initialMessage.trim(),
    })

    if (msgErr) {
      console.error("[chat/create-conversation] Error inserting message:", msgErr)
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje." },
        { status: 500 }
      )
    }

    // ── 4. Fire-and-forget: notify business owner by email ───────────────────
    // Runs after the response is prepared so it never delays the sender's UX.
    // Only fires when the sender is NOT the business owner (no self-notifications).
    if (business.owner_id && business.owner_id !== sender.id) {
      ;(async () => {
        try {
          // Fetch owner email + sender display name in parallel
          const [ownerResult, senderResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("email")
              .eq("id", business.owner_id)
              .single(),
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", sender.id)
              .single(),
          ])

          const ownerEmail: string | null = (ownerResult.data as any)?.email ?? null
          const senderName: string =
            (senderResult.data as any)?.full_name ||
            sender.user_metadata?.full_name ||
            "Un usuario"

          if (ownerEmail) {
            await sendChatNotificationEmail({
              to: ownerEmail,
              businessName: (business as any).name ?? "tu negocio",
              senderName,
              messagePreview: initialMessage.trim(),
            })
          }
        } catch (notifyErr) {
          // Never let a notification failure surface to the client
          console.warn("[chat/create-conversation] Email notification failed (non-blocking):", notifyErr)
        }
      })()
    }

    return NextResponse.json({ conversationId })
  } catch (err) {
    console.error("[chat/create-conversation] Unexpected error:", err)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
