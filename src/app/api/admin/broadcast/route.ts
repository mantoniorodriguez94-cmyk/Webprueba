/**
 * Anuncio a todos los usuarios (ADMIN)
 * POST /api/admin/broadcast
 *
 * Existía la notificación por perfil —de a uno— pero no había forma de avisar
 * a todos: una caída del servicio, un cambio de precios o un cambio de
 * términos había que comunicarlo usuario por usuario, o no comunicarlo.
 *
 * Reutiliza el mecanismo que ya existe (profiles.admin_message +
 * show_admin_modal, que el AdminMessageModal muestra al iniciar sesión) en vez
 * de inventar un sistema de notificaciones nuevo.
 *
 * `destino` permite acotar: muchos anuncios le interesan a los dueños de
 * negocio y no a quien sólo busca, y mandarle a todo el mundo lo que no le
 * toca es la forma más rápida de que dejen de leer los avisos.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

type Destino = "todos" | "negocios" | "personas"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { mensaje, destino = "todos", limpiar = false } = body as {
      mensaje?: string
      destino?: Destino
      limpiar?: boolean
    }

    if (!limpiar && !mensaje?.trim()) {
      return NextResponse.json(
        { success: false, error: "El mensaje no puede estar vacío" },
        { status: 400 }
      )
    }

    if (!["todos", "negocios", "personas"].includes(destino)) {
      return NextResponse.json(
        { success: false, error: "destino debe ser todos, negocios o personas" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Supabase exige un filtro en un update masivo, así que el caso "todos" se
    // expresa como "el rol no es un valor imposible" en vez de omitirlo.
    let consulta = (supabase as any)
      .from("profiles")
      .update(
        limpiar
          ? { admin_message: null, show_admin_modal: false }
          : { admin_message: mensaje!.trim(), show_admin_modal: true }
      )

    if (destino === "negocios") consulta = consulta.eq("role", "company")
    else if (destino === "personas") consulta = consulta.eq("role", "person")
    else consulta = consulta.neq("role", "__ninguno__")

    const { error, count } = await consulta.select("id", { count: "exact" })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo enviar el anuncio. Comprueba que profiles tiene las columnas admin_message y show_admin_modal.",
        },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: limpiar ? "broadcast.clear" : "broadcast.send",
      objetoTipo: "sistema",
      detalle: {
        destino,
        alcanzados: count ?? null,
        // Se guarda el texto: un anuncio masivo es la clase de acción sobre la
        // que después se pregunta "¿qué decía exactamente?".
        mensaje: limpiar ? null : mensaje!.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      message: limpiar
        ? `Anuncio retirado de ${count ?? 0} cuentas.`
        : `Anuncio enviado a ${count ?? 0} cuentas. Lo verán al entrar.`,
    })
  } catch (err) {
    console.error("[admin] broadcast:", err)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
