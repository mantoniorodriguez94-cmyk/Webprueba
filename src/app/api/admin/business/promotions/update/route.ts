/**
 * API Route: Update promotion fields (ADMIN)
 * POST /api/admin/business/promotions/update
 * Allows updating name and/or is_active of a promotion.
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
    const { id, name, is_active } = body as { id?: string; name?: string; is_active?: boolean }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id de promoción requerido" },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (typeof name === "string") updates.name = name.trim()
    if (typeof is_active === "boolean") updates.is_active = is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Incluye al menos un campo a actualizar (name, is_active)" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { error: dbError } = await supabase
      .from("promotions")
      // @ts-ignore - generated DB type may omit optional columns
      .update(updates)
      .eq("id", id)

    if (dbError) {
      return NextResponse.json(
        { success: false, error: "Error al actualizar la promoción" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Promoción actualizada correctamente" },
      { status: 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

