/**
 * API Route: Send direct notification to user (ADMIN)
 * POST /api/admin/profile-notification
 * Sets admin_message and show_admin_modal = true on profiles so the user sees the message in a modal.
 * Uses service role so admin can update any profile.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { profileId, message: bodyMessage, admin_message } = body
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId requerido" },
        { status: 400 }
      )
    }

    const message =
      typeof bodyMessage === "string"
        ? bodyMessage.trim()
        : typeof admin_message === "string"
          ? admin_message.trim()
          : ""

    const supabase = createAdminClient()
    const { error: updateErr } = await supabase
      .from("profiles")
      // @ts-ignore - generated DB type may omit admin_message, show_admin_modal
      .update({
        admin_message: message || null,
        show_admin_modal: true,
      })
      .eq("id", profileId)

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: "Error al guardar la notificación. Comprueba que las columnas admin_message y show_admin_modal existen en profiles." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notificación enviada. El usuario verá el mensaje al iniciar sesión.",
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
