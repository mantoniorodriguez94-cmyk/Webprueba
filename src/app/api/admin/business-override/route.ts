/**
 * API Route: Business override (ADMIN)
 * POST /api/admin/business-override
 * Updates extra_photo_limit, search_priority_boost, infraction_status, infraction_reason.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

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
    const {
      businessId,
      extra_photo_limit,
      search_priority_boost,
      infraction_status,
      infraction_reason,
    } = body
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (typeof extra_photo_limit === "number" && extra_photo_limit >= 0) {
      updates.extra_photo_limit = extra_photo_limit
    }
    if (typeof search_priority_boost === "boolean") {
      updates.search_priority_boost = search_priority_boost
    }
    if (typeof infraction_status === "boolean") {
      updates.infraction_status = infraction_status
      if (updates.infraction_status === false) {
        updates.infraction_reason = null
      }
    }
    if (typeof infraction_reason === "string") {
      updates.infraction_reason = infraction_reason.trim() || null
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Incluye al menos un campo a actualizar" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error: updateErr } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error business-override:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el negocio" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Negocio actualizado correctamente",
      data: updates,
    })
  } catch (err: unknown) {
    console.error("Error en business-override:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
