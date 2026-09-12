/**
 * Verificación de permisos de administrador.
 *
 * ── UNA SOLA FUENTE DE VERDAD: profiles.is_admin ────────────────────────────
 *
 * Antes esta función aceptaba también `user_metadata.is_admin`, por dos
 * caminos distintos:
 *
 *   1. Si no encontraba la fila de perfil, aceptaba el metadata.
 *   2. Al final hacía `profileIsAdmin || metadataIsAdmin`, así que el metadata
 *      alcanzaba incluso con un perfil que dijera is_admin: false.
 *
 * El problema es que `user_metadata` lo escribe el propio usuario: cualquiera
 * con una cuenta puede llamar a `supabase.auth.updateUser({ data: { is_admin:
 * true } })` desde el navegador y concederse el panel completo — que a su vez
 * usa la service-role key y salta RLS. Es una escalada de privilegios directa.
 *
 * Ahora sólo cuenta `profiles.is_admin`, que se escribe únicamente desde el
 * servidor. El metadata no se lee en ningún caso.
 *
 * ── FALLA CERRADO ───────────────────────────────────────────────────────────
 *
 * Si el perfil no se puede leer, la respuesta es "no autorizado". Antes un
 * error de lectura abría la puerta al camino del metadata; un fallo de base de
 * datos nunca debe traducirse en más permisos.
 */

import { createClient } from "@/utils/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export interface AdminAuthResult {
  user: {
    id: string
    email: string
    isAdmin: boolean
  } | null
  error: string | null
}

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    // 1. Identificar al usuario. getUser() valida el token contra Supabase,
    //    no se fía de la cookie.
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // "session missing" es lo normal cuando no hay sesión; no ensucia el log.
      if (authError && !authError.message.includes("session missing")) {
        console.error("[admin] Error de autenticación:", authError.message)
      }
      return { user: null, error: "No autenticado" }
    }

    // 2. Leer profiles.is_admin. Se prefiere el cliente de servicio porque las
    //    políticas RLS de profiles pueden impedirle al usuario leer su propia
    //    fila; si no está disponible, se intenta con su propio cliente.
    let profile: { is_admin: boolean | null; email: string | null } | null = null

    try {
      const { data } = await getAdminClient()
        .from("profiles")
        .select("is_admin, email")
        .eq("id", user.id)
        .single()
      profile = data
    } catch {
      // Sin service-role key configurada, o fallo al crearlo.
    }

    if (!profile) {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin, email")
        .eq("id", user.id)
        .single()
      profile = data
    }

    // 3. Sin perfil legible no hay permiso. Falla cerrado, a propósito.
    if (!profile) {
      return { user: null, error: "No autorizado" }
    }

    const isAdmin = profile.is_admin === true

    return {
      user: {
        id: user.id,
        email: profile.email || user.email || "",
        isAdmin,
      },
      error: isAdmin ? null : "No autorizado",
    }
  } catch (err) {
    console.error("[admin] Error verificando permisos:", err)
    return { user: null, error: "Error interno" }
  }
}

/**
 * Exige permisos de administrador o redirige. Para usar en layouts y páginas.
 *
 * No hace falta envolverla en try/catch: Next maneja la excepción de
 * redirect() por su cuenta.
 */
export async function requireAdmin() {
  const result = await checkAdminAuth()

  if (!result.user || !result.user.isAdmin) {
    redirect("/app/dashboard")
  }

  return result.user
}
