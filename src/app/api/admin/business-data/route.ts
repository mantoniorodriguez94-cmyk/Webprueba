/**
 * API Route: Get business override data (ADMIN)
 * GET /api/admin/business-data?businessId=xxx
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await checkAdminAuth()
    if (authError) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 403 }
      )
    }
    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("businesses")
      .select("id, owner_id, max_photos, search_priority_boost, infraction_status, infraction_reason, perk_borde_dorado_hasta, perk_promociones_hasta, perk_prioridad_hasta, perk_fotos_extra, perk_fotos_extra_hasta")
      .eq("id", businessId)
      .single()
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json({
      success: true,
      data: {
        owner_id: data.owner_id,
        max_photos: data.max_photos ?? 5,
        search_priority_boost: (data as { search_priority_boost?: boolean }).search_priority_boost ?? false,
        infraction_status: (data as { infraction_status?: boolean }).infraction_status ?? false,
        infraction_reason: (data as { infraction_reason?: string | null }).infraction_reason ?? null,
        perk_borde_dorado_hasta: (data as Record<string, unknown>).perk_borde_dorado_hasta ?? null,
        perk_promociones_hasta: (data as Record<string, unknown>).perk_promociones_hasta ?? null,
        perk_prioridad_hasta: (data as Record<string, unknown>).perk_prioridad_hasta ?? null,
        perk_fotos_extra: (data as Record<string, unknown>).perk_fotos_extra ?? 0,
        perk_fotos_extra_hasta: (data as Record<string, unknown>).perk_fotos_extra_hasta ?? null,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
