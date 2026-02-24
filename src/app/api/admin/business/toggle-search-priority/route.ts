/**
 * API Route: Toggle search priority (ADMIN)
 * POST /api/admin/business/toggle-search-priority
 * Toggles search_priority_boost so the business appears at top of search.
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
    const { businessId } = body as { businessId?: string }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { data: business, error: fetchErr } = await supabase
      .from("businesses")
      .select("id, name, search_priority_boost")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    const current = (business as any).search_priority_boost === true
    const next = !current

    const { error: updateErr } = await supabase
      .from("businesses")
      .update({ search_priority_boost: next })
      .eq("id", businessId)

    if (updateErr) {
      if ((updateErr as any).code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "La columna search_priority_boost no existe. Añádela en Supabase antes de usar esta función.",
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: "Error al actualizar la prioridad de búsqueda" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: next
          ? `Negocio "${business.name}" priorizado en resultados de búsqueda.`
          : `Prioridad de búsqueda desactivada para "${business.name}".`,
        data: { search_priority_boost: next },
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

