/**
 * Utilidad para verificar autenticación y permisos de administrador
 * 100% compatible con Next.js 15 + Supabase SSR
 */

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export interface AdminAuthResult {
  user: {
    id: string
    email: string
    isAdmin: boolean
  } | null
  error: string | null
}

/**
 * Verifica si el usuario actual es administrador (SSR SAFE)
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    // 1️⃣ Crear el cliente ESPERANDO la promesa (Next.js 15)
    const supabase = await createClient()

    // 2️⃣ Verificar sesión con getUser()
    // Nota: getUser valida el token real contra Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // No logueamos error 400 (session missing) para no ensuciar la consola, es normal si no hay sesión
      if (authError && !authError.message.includes("session missing")) {
         console.error("⚠️ Error de Auth en admin:", authError.message)
      }
      return { user: null, error: "No autenticado" }
    }

    // 3️⃣ Verificar rol en tabla "profiles"
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { user: null, error: "Perfil no encontrado" }
    }

    const isAdmin = profile.is_admin === true

    return {
      user: {
        id: user.id,
        email: profile.email || user.email || "",
        isAdmin
      },
      error: isAdmin ? null : "No autorizado"
    }

  } catch (err) {
    console.error("❌ Error CRÍTICO en checkAdminAuth:", err)
    return { user: null, error: "Error interno" }
  }
}

/**
 * Redirige si el usuario no es administrador
 * Úsalo en layouts o page.tsx
 */
export async function requireAdmin() {
  const result = await checkAdminAuth()

  // Si falla la autenticación o no es admin, redirigir
  if (!result.user || !result.user.isAdmin) {
    // Opcional: Redirigir a login en lugar de dashboard si el error es "No autenticado"
    redirect("/app/dashboard")
  }

  return result.user
}