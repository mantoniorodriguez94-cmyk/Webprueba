/**
 * API Route: Toggle Spotlight (ADMIN)
 * POST /api/admin/business/toggle-spotlight
 * Forces the business to appear in the "Promociones Spotlight" carousel regardless of owner tier.
 * Uses is_featured + featured_until (long-dated) so existing logic can be extended to show
 * featured businesses in spotlight; alternatively add spotlight_override column if needed.
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
      .select("id, name, is_featured, featured_until")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    // Use is_featured as "spotlight override": when true, frontend shows in spotlight regardless of tier
    const now = new Date()
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    const currentlyInSpotlight = business.is_featured && business.featured_until && new Date(business.featured_until) > now
    const newFeatured = !currentlyInSpotlight

    const { error: updateErr } = await supabase
      .from("businesses")
      .update({
        is_featured: newFeatured,
        featured_until: newFeatured ? oneYearFromNow.toISOString() : null,
      })
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error toggle spotlight:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar spotlight" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: newFeatured
        ? `"${business.name}" ahora aparece en el Spotlight de promociones.`
        : `"${business.name}" ya no está forzado en el Spotlight.`,
      data: { in_spotlight: newFeatured },
    })
  } catch (err: unknown) {
    console.error("Error en toggle-spotlight:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
