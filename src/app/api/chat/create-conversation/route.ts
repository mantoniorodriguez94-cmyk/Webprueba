/**
 * POST /api/chat/create-conversation
 *
 * Server-side gate for creating/finding a conversation and sending the
 * first message.  Two-layer access check:
 *
 *  Layer 1 — Sender (visitor)  : must have subscription_tier >= 1 OR be admin
 *  Layer 2 — Business owner    : must pass hasChatAccess()
 *                                (tier >= 1 OR chat_expires_at in future OR chat_enabled)
 *
 * Returns { conversationId: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasChatAccess } from "@/lib/chat/access"
import { sendChatNotificationEmail } from "@/lib/emails"

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
    // Chat está abierto para todos los usuarios autenticados; no se requiere plan.
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
