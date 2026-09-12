/**
 * Resolver o descartar un reporte (ADMIN)
 * POST /api/admin/reports/update
 *
 * La página de reportes listaba lo que los usuarios reportaban, pero sus
 * enlaces de detalle apuntaban a una ruta que no existe, así que no había
 * ninguna forma de cerrar un reporte: la cola sólo crecía.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

const ESTADOS = ["pending", "reviewed", "resolved", "dismissed"] as const
type Estado = (typeof ESTADOS)[number]

const TABLAS = {
  business: "business_reports",
  review: "review_reports",
} as const

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { reportId, tipo, estado, notas } = body as {
      reportId?: string
      tipo?: keyof typeof TABLAS
      estado?: Estado
      notas?: string
    }

    if (!reportId || !tipo || !TABLAS[tipo]) {
      return NextResponse.json(
        { success: false, error: "reportId y tipo (business|review) son requeridos" },
        { status: 400 }
      )
    }

    if (!estado || !ESTADOS.includes(estado)) {
      return NextResponse.json(
        { success: false, error: `estado debe ser uno de: ${ESTADOS.join(", ")}` },
        { status: 400 }
      )
    }

    const { error: updateError } = await getAdminClient()
      .from(TABLAS[tipo])
      // @ts-expect-error - los tipos generados todavía no incluyen estas tablas
      .update({
        status: estado,
        admin_notes: notas?.trim() || null,
      })
      .eq("id", reportId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "No se pudo actualizar el reporte" },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: `report.${estado}`,
      objetoTipo: "report",
      objetoId: reportId,
      detalle: { tipo, notas: notas?.trim() ?? null },
    })

    return NextResponse.json({ success: true, message: "Reporte actualizado" })
  } catch (err) {
    console.error("[admin] reports/update:", err)
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
