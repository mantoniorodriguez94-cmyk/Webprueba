/**
 * Ocultar o restaurar una reseña (ADMIN)
 * POST /api/admin/reviews/toggle-hidden
 *
 * No existía ninguna acción de administración sobre las reseñas. Un usuario
 * podía reportar una, pero del otro lado no había nada que hacer con el
 * reporte: una reseña difamatoria sobre un negocio que paga se quedaba
 * publicada.
 *
 * Oculta en vez de borrar. Una reseña retirada por error se restaura, y si el
 * autor reclama queda el texto original para revisarlo. Borrar no deja nada.
 *
 * Requiere las columnas de scripts/panel-admin-control.sql.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

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
    const { reviewId, ocultar, motivo } = body as {
      reviewId?: string
      ocultar?: boolean
      motivo?: string
    }

    if (!reviewId || typeof ocultar !== "boolean") {
      return NextResponse.json(
        { success: false, error: "reviewId y ocultar son requeridos" },
        { status: 400 }
      )
    }

    // Ocultar sin decir por qué deja el registro inservible: dentro de un mes
    // nadie recuerda la razón, y es justo lo que hay que poder explicarle a
    // quien reclame.
    if (ocultar && !motivo?.trim()) {
      return NextResponse.json(
        { success: false, error: "Hace falta un motivo para ocultar una reseña" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: review } = await supabase
      .from("reviews")
      .select("id, business_id, rating, comment")
      .eq("id", reviewId)
      .single()

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Reseña no encontrada" },
        { status: 404 }
      )
    }

    // Cast: los tipos generados todavía no incluyen las columnas hidden_*.
    const { error: updateError } = await (supabase as any)
      .from("reviews")
      .update(
        ocultar
          ? {
              hidden_at: new Date().toISOString(),
              hidden_by: user.id,
              hidden_reason: motivo!.trim(),
            }
          : { hidden_at: null, hidden_by: null, hidden_reason: null }
      )
      .eq("id", reviewId)

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo actualizar la reseña. Comprueba que ejecutaste scripts/panel-admin-control.sql.",
        },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: ocultar ? "review.hide" : "review.unhide",
      objetoTipo: "review",
      objetoId: reviewId,
      detalle: {
        motivo: motivo?.trim() ?? null,
        negocio_id: (review as { business_id?: string }).business_id ?? null,
        // Se guarda el texto: si después se borra la reseña, el registro sigue
        // explicando qué se retiró.
        comentario: (review as { comment?: string }).comment ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      message: ocultar ? "Reseña ocultada" : "Reseña restaurada",
    })
  } catch (err) {
    console.error("[admin] toggle-hidden:", err)
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
