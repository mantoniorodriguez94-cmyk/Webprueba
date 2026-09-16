/**
 * API Route: Conceder beneficios sueltos a un negocio (ADMIN)
 * POST /api/admin/business/perks
 *
 * Cada beneficio se concede por una cantidad de meses; 0 lo retira. La fecha
 * se calcula en el servidor y no se acepta del cliente, para que no dependa
 * del reloj del navegador de quien la envía.
 *
 * Se escribe con la service role key: la política RLS de UPDATE sobre
 * `businesses` es `auth.uid() = owner_id`, así que un admin no puede tocar el
 * negocio de otra persona por la vía normal.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { vencimientoEnMeses } from "@/lib/memberships/perks"

const MAX_MESES = 120

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
    const {
      businessId,
      bordeDoradoMeses,
      promocionesMeses,
      prioridadMeses,
      fotosExtra,
      fotosExtraMeses,
    } = body as {
      businessId?: string
      bordeDoradoMeses?: number
      promocionesMeses?: number
      prioridadMeses?: number
      fotosExtra?: number
      fotosExtraMeses?: number
    }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }

    const meses = (valor: unknown): number | null => {
      if (typeof valor !== "number" || !Number.isFinite(valor)) return null
      return Math.min(MAX_MESES, Math.max(0, Math.floor(valor)))
    }

    const updates: Record<string, unknown> = {}

    const borde = meses(bordeDoradoMeses)
    if (borde !== null) updates.perk_borde_dorado_hasta = vencimientoEnMeses(borde)

    const promos = meses(promocionesMeses)
    if (promos !== null) updates.perk_promociones_hasta = vencimientoEnMeses(promos)

    const prioridad = meses(prioridadMeses)
    if (prioridad !== null) updates.perk_prioridad_hasta = vencimientoEnMeses(prioridad)

    const fotosMeses = meses(fotosExtraMeses)
    if (fotosMeses !== null) {
      updates.perk_fotos_extra_hasta = vencimientoEnMeses(fotosMeses)
      // Sin meses vigentes las fotos extra no cuentan; se guarda 0 para que la
      // cifra no quede colgando y confunda a quien abra el panel después.
      updates.perk_fotos_extra =
        fotosMeses > 0 ? Math.min(50, Math.max(0, Math.floor(Number(fotosExtra) || 0))) : 0
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No se indicó ningún beneficio que cambiar" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { error: updateErr } = await supabase
      .from("businesses")
      // @ts-ignore - los tipos generados pueden no incluir las columnas perk_*
      .update(updates)
      .eq("id", businessId)

    if (updateErr) {
      if ((updateErr as { code?: string }).code === "42703") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Faltan las columnas perk_*. Ejecuta supabase/migrations/20260914110002_beneficios_sueltos.sql en Supabase.",
          },
          { status: 500 }
        )
      }
      console.error("[perks] Error actualizando:", updateErr)
      return NextResponse.json(
        { success: false, error: "No se pudieron guardar los beneficios" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updates }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
