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

    // 3️⃣ Verificar rol en tabla "profiles"
    // ⚠️ CRUCIAL: await necesario para queries a Supabase
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single()

    // Manejar error de perfil
    if (profileError) {
      // Si es un error de RLS o perfil no encontrado, intentar con service role como fallback
      // No logueamos el error inicial para evitar errores {} en consola
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          console.log("🔄 Intentando leer perfil con service role key...")
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          const { data: serviceProfile, error: serviceError } = await serviceSupabase
            .from("profiles")
            .select("is_admin, email")
            .eq("id", user.id)
            .single()

          if (!serviceError && serviceProfile) {
            console.log("✅ Lectura exitosa con service role key")
            const isAdmin = serviceProfile.is_admin === true
            
            if (isAdmin) {
              console.log("✅ Usuario admin verificado (service role):", {
                userId: user.id,
                email: serviceProfile.email || user.email
              })
            }
            
            return {
              user: {
                id: user.id,
                email: serviceProfile.email || user.email || "",
                isAdmin
              },
              error: isAdmin ? null : "No autorizado"
            }
          }
          // Silenciosamente continuar si hay error con service role
        } catch {
          // Silenciosamente manejar el error - el fallback ya falló
        }
      }

      return { user: null, error: `Error al leer perfil: ${profileError.message || "Error desconocido"}` }
    }

    if (!profile) {
      console.error("❌ Perfil no existe para usuario:", {
        userId: user.id,
        email: user.email
      })
      return { user: null, error: "Perfil no encontrado" }
    }

    const isAdmin = profile.is_admin === true

    // Log para debugging (solo si es admin para no ensuciar logs)
    if (isAdmin) {
      console.log("✅ Usuario admin verificado:", {
        userId: user.id,
        email: profile.email || user.email
      })
    }

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
    console.log('🔒 Acceso denegado al panel admin:', {
      userId: result.user?.id,
      email: result.user?.email,
      isAdmin: result.user?.isAdmin,
      error: result.error
    })
    // redirect() lanza una excepción especial que Next.js maneja automáticamente
    redirect("/app/dashboard")
  }

  // Si llegamos aquí, el usuario es admin
  return result.user
}