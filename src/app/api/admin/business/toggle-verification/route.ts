/**
 * API Route: Toggle verification badge (ADMIN)
 * POST /api/admin/business/toggle-verification
 * Toggles is_verified on the business (adds/removes "Verified" badge).
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
      .select("id, name, is_verified")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    const newVerified = !business.is_verified
    const { error: updateErr } = await supabase
      .from("businesses")
      .update({ is_verified: newVerified })
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error toggle verification:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar verificación" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: newVerified
        ? `Negocio "${business.name}" marcado como verificado.`
        : `Verificación removida de "${business.name}".`,
      data: { is_verified: newVerified },
    })
  } catch (err: unknown) {
    console.error("Error en toggle-verification:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
