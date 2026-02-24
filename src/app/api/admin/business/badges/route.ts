/**
 * API Route: Update business badges (ADMIN)
 * POST /api/admin/business/badges
 * Sets badges array on the business (e.g. ["Verificado","Oferta","Nuevo"]).
 *
 * NOTE: If badges column does not exist, returns a migration hint instead of crashing.
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

    const cookieStore = cookies()
    const pinCookie = cookieStore.get("admin_master_ok")
    if (!pinCookie) {
      return NextResponse.json(
        { success: false, error: "PIN maestro requerido para esta acción." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { businessId, badges } = body as { businessId?: string; badges?: string[] }

    if (!businessId || !Array.isArray(badges)) {
      return NextResponse.json(
        { success: false, error: "businessId y badges (array de strings) son requeridos" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { error: updateErr } = await supabase
      .from("businesses")
      .update({ badges })
      .eq("id", businessId)

    if (updateErr) {
      if ((updateErr as any).code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "La columna badges no existe en businesses. Añádela como text[] antes de usar esta función.",
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: "Error al actualizar badges del negocio" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Badges del negocio actualizados correctamente.",
        data: { badges },
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

