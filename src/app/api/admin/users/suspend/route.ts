/**
 * Suspender o reactivar una persona (ADMIN)
 * POST /api/admin/users/suspend
 *
 * La única acción disponible sobre una persona problemática era eliminarla.
 * Eso es irreversible y se lleva por delante sus negocios, sus reseñas y su
 * historial de pagos — demasiado para alguien que escribió una reseña abusiva
 * o mandó spam por chat.
 *
 * Suspender es el punto medio: la cuenta sigue existiendo, se puede levantar,
 * y queda escrito el motivo.
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
    const { profileId, suspender, motivo } = body as {
      profileId?: string
      suspender?: boolean
      motivo?: string
    }

    if (!profileId || typeof suspender !== "boolean") {
      return NextResponse.json(
        { success: false, error: "profileId y suspender son requeridos" },
        { status: 400 }
      )
    }

    if (suspender && !motivo?.trim()) {
      return NextResponse.json(
        { success: false, error: "Hace falta un motivo para suspender una cuenta" },
        { status: 400 }
      )
    }

    // Suspenderse a uno mismo deja el panel sin administrador operativo y no
    // hay forma de deshacerlo desde la interfaz.
    if (profileId === user.id) {
      return NextResponse.json(
        { success: false, error: "No puedes suspender tu propia cuenta" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: perfil } = await supabase
      .from("profiles")
      .select("id, email, is_admin")
      .eq("id", profileId)
      .single()

    if (!perfil) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Un administrador suspendido seguiría teniendo permisos: la suspensión
    // limita la actividad del usuario, no el acceso al panel. Hay que quitarle
    // el rol primero, para que la acción signifique lo que aparenta.
    if (suspender && (perfil as { is_admin?: boolean }).is_admin === true) {
      return NextResponse.json(
        {
          success: false,
          error: "Esa cuenta es administradora. Quítale el rol de admin antes de suspenderla.",
        },
        { status: 400 }
      )
    }

    // Cast: los tipos generados todavía no incluyen las columnas suspended_*.
    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update(
        suspender
          ? { suspended_at: new Date().toISOString(), suspended_reason: motivo!.trim() }
          : { suspended_at: null, suspended_reason: null }
      )
      .eq("id", profileId)

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo actualizar la cuenta. Comprueba que ejecutaste scripts/panel-admin-control.sql.",
        },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: suspender ? "user.suspend" : "user.unsuspend",
      objetoTipo: "profile",
      objetoId: profileId,
      detalle: {
        correo: (perfil as { email?: string }).email ?? null,
        motivo: motivo?.trim() ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      message: suspender ? "Cuenta suspendida" : "Cuenta reactivada",
    })
  } catch (err) {
    console.error("[admin] users/suspend:", err)
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
