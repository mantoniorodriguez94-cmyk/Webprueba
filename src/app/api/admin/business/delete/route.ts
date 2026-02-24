/**
 * API Route: Delete business (ADMIN)
 * POST /api/admin/business/delete
 * Permanently deletes a business and related data. Requires confirmation on client.
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
    const { businessId } = body
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: business, error: fetchErr } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    // Delete business (cascade may remove related rows depending on DB constraints)
    const { error: deleteErr } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId)

    if (deleteErr) {
      console.error("Error deleting business:", deleteErr)
      return NextResponse.json(
        { success: false, error: "Error al eliminar el negocio. Puede haber datos dependientes." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Negocio "${business.name}" eliminado correctamente.`,
    })
  } catch (err: unknown) {
    console.error("Error en delete business:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
