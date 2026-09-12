/**
 * Ocultar o restaurar un negocio del directorio (ADMIN)
 * POST /api/admin/business/toggle-hidden
 *
 * El punto medio que faltaba. Hasta ahora, ante una estafa o un contenido que
 * viola las reglas, la única acción era "Eliminar": irreversible, y se lleva
 * por delante las reseñas, el historial de chat, las fotos y los pagos. Si
 * después alguien reclama, no queda constancia de nada.
 *
 * Ocultar deja el negocio intacto y fuera de la vista. El filtrado lo hace la
 * base con una política restrictiva (scripts/ocultar-negocio.sql), no este
 * código: hay diez consultas distintas que muestran negocios y filtrar en cada
 * una garantiza que la próxima que se escriba se olvide.
 *
 * El dueño sigue viendo su ficha, con el aviso, para poder corregir.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { businessId, ocultar, motivo } = body as {
      businessId?: string
      ocultar?: boolean
      motivo?: string
    }

    if (!businessId || typeof ocultar !== "boolean") {
      return NextResponse.json(
        { success: false, error: "businessId y ocultar son requeridos" },
        { status: 400 }
      )
    }

    // El motivo se le muestra al dueño en su pantalla de gestión. Sin él, el
    // negocio desaparece del directorio y su dueño no tiene forma de saber qué
    // corregir — y tú tampoco, dentro de un mes.
    if (ocultar && !motivo?.trim()) {
      return NextResponse.json(
        { success: false, error: "Hace falta un motivo para ocultar un negocio" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: negocio } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .single()

    if (!negocio) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    const { error: updateError } = await (supabase as any)
      .from("businesses")
      .update(
        ocultar
          ? {
              hidden_at: new Date().toISOString(),
              hidden_by: user.id,
              hidden_reason: motivo!.trim(),
            }
          : { hidden_at: null, hidden_by: null, hidden_reason: null }
      )
      .eq("id", businessId)

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo actualizar el negocio. Comprueba que ejecutaste scripts/ocultar-negocio.sql.",
        },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: ocultar ? "business.hide" : "business.unhide",
      objetoTipo: "business",
      objetoId: businessId,
      detalle: {
        nombre: (negocio as { name?: string }).name ?? null,
        dueno_id: (negocio as { owner_id?: string }).owner_id ?? null,
        motivo: motivo?.trim() ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      message: ocultar
        ? "Negocio oculto del directorio. Su dueño lo sigue viendo con el aviso."
        : "Negocio visible de nuevo en el directorio.",
    })
  } catch (err) {
    console.error("[admin] business/toggle-hidden:", err)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
