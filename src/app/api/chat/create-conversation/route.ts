/**
 * POST /api/chat/create-conversation
 *
 * Creates or finds an existing conversation and inserts the first message.
 * Only requirement: the sender must be authenticated and the business must exist.
 * No subscription-tier or perk checks are applied.
 *
 * Returns { conversationId: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // ── 2. Fetch business (existence check only) ─────────────────────────────
    const supabase = createAdminClient()

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, owner_id")
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

    // ── 4. Insert first message ───────────────────────────────────────────────
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

    return NextResponse.json({ conversationId })
  } catch (err) {
    console.error("[chat/create-conversation] Unexpected error:", err)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
