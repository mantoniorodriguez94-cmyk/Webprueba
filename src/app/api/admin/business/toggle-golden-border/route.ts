/**
 * API Route: Toggle golden border (ADMIN)
 * POST /api/admin/business/toggle-golden-border
 * Toggles has_golden_border on the business to control Founder visual style.
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
    const { businessId } = body as { businessId?: string }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Leer valor actual
    const { data: business, error: fetchErr } = await supabase
      .from("businesses")
      .select("id, name, has_gold_border")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business) {
      // Si la columna no existe, devolver nota de migración
      if ((fetchErr as any)?.code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "La columna has_gold_border no existe. Añádela en Supabase antes de usar esta función.",
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    const current = (business as any).has_gold_border === true
    const next = !current

    const { error: updateErr } = await supabase
      .from("businesses")
      // @ts-ignore - generated DB type may omit has_gold_border
      .update({ has_gold_border: next })
      .eq("id", businessId)

    if (updateErr) {
      if ((updateErr as any).code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error: "La columna has_gold_border no existe. Añádela en Supabase antes de usar esta función.",
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: "Error al actualizar el borde dorado" },
        { status: 500 }
      )
    }

    const name = (business as { name?: string }).name ?? "Negocio"
    return NextResponse.json(
      {
        success: true,
        message: next
          ? `Borde dorado activado para "${name}".`
          : `Borde dorado desactivado para "${name}".`,
        data: { has_gold_border: next },
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

