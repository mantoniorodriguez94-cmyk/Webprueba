/**
 * Utilidad para verificar autenticación y permisos de administrador
 * Compatible con Next.js 15 y Supabase SSR
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
 * Verifica si el usuario actual es administrador
 * Retorna null si no está autenticado o no es admin
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        user: null,
        error: "No autenticado"
      }
    }

    // Verificar si es admin desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return {
        user: null,
        error: "Perfil no encontrado"
      }
    }

    const isAdmin = profile.is_admin === true

    return {
      user: {
        id: user.id,
        email: user.email || "",
        isAdmin
      },
      error: isAdmin ? null : "No autorizado"
    }
  } catch (error) {
    console.error("Error en checkAdminAuth:", error)
    return {
      user: null,
      error: "Error al verificar permisos"
    }
  }
}

/**
 * Protege una ruta admin - redirige si no es admin
 * Usar en Server Components o Server Actions
 */
export async function requireAdmin() {
  const { user, error } = await checkAdminAuth()
  
  if (!user || !user.isAdmin) {
    redirect("/app/dashboard")
  }
  
  return user
}

