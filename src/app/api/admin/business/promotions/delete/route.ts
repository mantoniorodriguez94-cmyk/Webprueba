/**
 * API Route: Delete promotion (ADMIN)
 * POST /api/admin/business/promotions/delete
 * Permanently deletes a promotion by id.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"

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
    const { id } = body as { id?: string }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id de promoción requerido" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { error: dbError } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id)

    if (dbError) {
      return NextResponse.json(
        { success: false, error: "Error al eliminar la promoción" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Promoción eliminada correctamente" },
      { status: 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

