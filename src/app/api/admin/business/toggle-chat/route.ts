/**
 * API Route: Toggle business chat (ADMIN)
 * POST /api/admin/business/toggle-chat
 * Sets chat_enabled on the business to allow/block direct messages.
 *
 * NOTE: If chat_enabled column does not exist, returns a migration hint instead of crashing.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const cookieStore = await cookies()
    const pinCookie = cookieStore.get("admin_master_ok")
    if (!pinCookie) {
      return NextResponse.json(
        { success: false, error: "PIN maestro requerido para esta acción." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { businessId, enabled } = body as { businessId?: string; enabled?: boolean }

    if (!businessId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "businessId y enabled (boolean) son requeridos" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { error: updateErr } = await supabase
      .from("businesses")
      // @ts-ignore - generated DB type may omit chat_enabled
      .update({ chat_enabled: enabled })
      .eq("id", businessId)

    if (updateErr) {
      if ((updateErr as any).code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "La columna chat_enabled no existe en businesses. Añádela con un script de migración antes de usar esta función.",
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: "Error al actualizar el estado del chat" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: enabled
          ? "Chat habilitado para este negocio. Ahora puede recibir mensajes directos."
          : "Chat deshabilitado. El negocio ya no recibirá mensajes directos.",
        data: { chat_enabled: enabled },
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

