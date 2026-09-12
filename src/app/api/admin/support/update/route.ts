/**
 * Cambiar el estado de un mensaje de soporte (ADMIN)
 * POST /api/admin/support/update
 *
 * El formulario de soporte guardaba en support_messages, pero su política RLS
 * impide leer desde el navegador y no había ninguna pantalla que los mostrara:
 * los mensajes entraban y quedaban invisibles. La única vía era el correo de
 * Resend — el mismo que estuvo saliendo desde un remitente de prueba.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

const ESTADOS = ["pending", "in_progress", "resolved"] as const
type Estado = (typeof ESTADOS)[number]

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { messageId, estado, notas } = body as {
      messageId?: string
      estado?: Estado
      notas?: string
    }

    if (!messageId || !estado || !ESTADOS.includes(estado)) {
      return NextResponse.json(
        { success: false, error: `messageId y estado (${ESTADOS.join(" | ")}) son requeridos` },
        { status: 400 }
      )
    }

    const { error } = await (getAdminClient() as any)
      .from("support_messages")
      .update({
        status: estado,
        admin_notes: notas?.trim() || null,
        resolved_at: estado === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", messageId)

    if (error) {
      return NextResponse.json(
        { success: false, error: "No se pudo actualizar el mensaje" },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: `support.${estado}`,
      objetoTipo: "sistema",
      objetoId: messageId,
      detalle: { notas: notas?.trim() ?? null },
    })

    return NextResponse.json({ success: true, message: "Mensaje actualizado" })
  } catch (err) {
    console.error("[admin] support/update:", err)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
