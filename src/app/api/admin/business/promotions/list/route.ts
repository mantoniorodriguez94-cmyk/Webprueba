/**
 * API Route: List promotions for a business (ADMIN)
 * POST /api/admin/business/promotions/list
 * Returns basic promotion info for the given business_id.
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
    const { businessId } = body as { businessId?: string }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { data, error: dbError } = await supabase
      .from("promotions")
      .select("id, name, is_active, start_date, end_date")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (dbError) {
      return NextResponse.json(
        { success: false, error: "Error al cargar promociones" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
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

