/**
 * API Route: Dismiss admin notification (user or admin)
 * POST /api/admin/profile-notification-dismiss
 * Sets show_admin_modal = false for the current user's profile (user calls this when clicking "Entendido").
 * Requires the request to be from the same user (profileId = current user id) or from an admin.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { user: adminUser, error: authError } = await checkAdminAuth()

    const body = await request.json()
    const { profileId } = body
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId requerido" },
        { status: 400 }
      )
    }

    const isAdmin = !authError && adminUser?.isAdmin
    const isOwnProfile = authUser?.id === profileId
    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ show_admin_modal: false })
      .eq("id", profileId)

    if (updateErr) {
      console.error("Error profile-notification-dismiss:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al cerrar la notificación" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notificación cerrada",
    })
  } catch (err: unknown) {
    console.error("Error en profile-notification-dismiss:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
