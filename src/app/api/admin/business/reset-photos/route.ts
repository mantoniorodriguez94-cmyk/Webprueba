/**
 * API Route: Reset business photos (ADMIN)
 * POST /api/admin/business/reset-photos
 * Clears gallery_urls and optionally logo_url for the business.
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
    const { businessId, resetLogo = false } = body
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

    const updatePayload: { gallery_urls: string[]; logo_url?: string | null } = {
      gallery_urls: [],
    }
    if (resetLogo) updatePayload.logo_url = null

    const { error: updateErr } = await supabase
      .from("businesses")
      .update(updatePayload)
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error reset photos:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al restablecer fotos" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Fotos de "${business.name}" restablecidas correctamente.`,
      data: { resetLogo: !!resetLogo },
    })
  } catch (err: unknown) {
    console.error("Error en reset-photos:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
