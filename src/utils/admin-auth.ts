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
 * 
 * ⚠️ IMPORTANTE: Todos los await son CRUCIALES en Next.js 15
 * - await createClient() - Next.js 15 requiere await para cookies()
 * - await supabase.auth.getUser() - Necesario para verificar sesión
 * - await supabase.from()... - Necesario para queries
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    // 1️⃣ Crear el cliente ESPERANDO la promesa (Next.js 15)
    // ⚠️ CRUCIAL: await es necesario porque createClient() usa cookies() que es async
    const supabase = await createClient()

    // 2️⃣ Verificar sesión con getUser()
    // ⚠️ CRUCIAL: await necesario para getUser()
    // Nota: getUser valida el token real contra Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // No logueamos error 400 (session missing) para no ensuciar la consola, es normal si no hay sesión
      if (authError && !authError.message.includes("session missing")) {
         console.error("⚠️ Error de Auth en admin:", authError.message)
      }
      return { user: null, error: "No autenticado" }
    }

    // 2.5️⃣ Verificar is_admin en user_metadata como fallback rápido
    // Esto ayuda cuando is_admin está en metadata pero no en profiles aún
    const metadataIsAdmin = user.user_metadata?.is_admin === true

    // 3️⃣ Verificar rol en tabla "profiles"
    // ⚠️ IMPORTANTE: En producción, siempre intentar con service role key primero si está disponible
    // Esto bypassa problemas de RLS y asegura que funcione correctamente
    
    let profile: { is_admin: boolean; email: string | null } | null = null
    let profileError: any = null

    // Si tenemos service role key, usarlo directamente (más confiable en producción)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        const { data: serviceProfile, error: serviceError } = await serviceSupabase
          .from("profiles")
          .select("is_admin, email")
          .eq("id", user.id)
          .single()

        if (!serviceError && serviceProfile) {
          profile = serviceProfile
          profileError = null
        } else {
          profileError = serviceError
        }
      } catch (err: any) {
        profileError = err
      }
    }

    // Si no funcionó con service role (o no está disponible), intentar con cliente normal
    if (!profile && !profileError) {
      const result = await supabase
        .from("profiles")
        .select("is_admin, email")
        .eq("id", user.id)
        .single()
      
      profile = result.data
      profileError = result.error
    }

    // Manejar error de perfil
    if (profileError || !profile) {
      // Si es un error de RLS o perfil no encontrado, intentar con service role como fallback final
      if (profileError && process.env.SUPABASE_SERVICE_ROLE_KEY && !profile) {
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )
          
          const { data: serviceProfile, error: serviceError } = await serviceSupabase
            .from("profiles")
            .select("is_admin, email")
            .eq("id", user.id)
            .single()

          if (!serviceError && serviceProfile) {
            profile = serviceProfile
            profileError = null
          }
        } catch {
          // Silenciosamente manejar el error - el fallback ya falló
        }
      }

      // Si no hay perfil pero tenemos metadataIsAdmin, aceptar como admin
      if (!profile && metadataIsAdmin) {
        return {
          user: {
            id: user.id,
            email: user.email || "",
            isAdmin: true
          },
          error: null
        }
      }

      if (!profile) {
        return { user: null, error: `Error al leer perfil: ${profileError?.message || "Perfil no encontrado"}` }
      }
    }

    // Verificar is_admin de múltiples fuentes para máxima compatibilidad
    const profileIsAdmin = profile.is_admin === true
    const isAdmin = profileIsAdmin || metadataIsAdmin

    return {
      user: {
        id: user.id,
        email: profile.email || user.email || "",
        isAdmin
      },
      error: isAdmin ? null : "No autorizado"
    }

  } catch (err: any) {
    console.error("❌ Error CRÍTICO en checkAdminAuth:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name
    })
    return { user: null, error: "Error interno" }
  }
}

/**
 * Redirige si el usuario no es administrador
 * Úsalo en layouts o page.tsx
 * 
 * ⚠️ IMPORTANTE: Esta función hace redirect() si el usuario no es admin.
 * Next.js maneja automáticamente la excepción de redirect(), así que
 * NO necesitas try-catch alrededor de esta función.
 */
export async function requireAdmin() {
  // ⚠️ CRUCIAL: await checkAdminAuth() - Next.js 15 requiere await
  const result = await checkAdminAuth()

  // Si falla la autenticación o no es admin, redirigir
  if (!result.user || !result.user.isAdmin) {
    redirect("/app/dashboard")
  }

  // Si llegamos aquí, el usuario es admin
  return result.user
}