/**
 * POST /api/chat/create-conversation
 *
 * Creates or finds an existing conversation between the authenticated sender
 * and the target business, then inserts the first message.
 *
 * Server-side gate: BOTH the sender and the business owner need an active
 * paid membership (tier >= 1). This mirrors the client-side gates
 * (SendMessageModal for the sender, negocios/[id]/page.tsx's ownerHasChat
 * for the receiver) — never trust the client alone, the API must be able
 * to reject a request even if someone calls it directly.
 *
 * Returns { conversationId: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendChatNotificationEmail } from "@/lib/emails"
import { isTierActive } from "@/lib/memberships/tiers"

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

    // ── 2b. Membership gate — BOTH sides need an active tier ──────────────────
    const [senderProfileResult, ownerProfileResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("subscription_tier, subscription_end_date")
        .eq("id", sender.id)
        .maybeSingle(),
      business.owner_id
        ? supabase
            .from("profiles")
            .select("subscription_tier, subscription_end_date")
            .eq("id", business.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const senderTier = (senderProfileResult.data as any)?.subscription_tier ?? 0
    const senderEndDate = (senderProfileResult.data as any)?.subscription_end_date ?? null

    if (!isTierActive(senderTier, senderEndDate)) {
      return NextResponse.json(
        { error: "Necesitas una membresía activa para enviar mensajes." },
        { status: 403 }
      )
    }

    const ownerTier = (ownerProfileResult.data as any)?.subscription_tier ?? 0
    const ownerEndDate = (ownerProfileResult.data as any)?.subscription_end_date ?? null

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
