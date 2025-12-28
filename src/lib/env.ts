/**
 * Validación de Variables de Entorno
 * 
 * Este archivo valida que las variables de entorno críticas estén configuradas
 * y lanza errores descriptivos si faltan.
 */

/**
 * Variables de entorno requeridas para Supabase
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

/**
 * Valida que todas las variables de entorno requeridas estén configuradas
 * @throws Error si alguna variable falta
 */
export function validateEnv(): void {
  const missing: string[] = []

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  if (missing.length > 0) {
    const errorMessage = `❌ Variables de entorno faltantes: ${missing.join(', ')}`
    console.error(errorMessage)
    console.error('Por favor, configura estas variables en tu archivo .env.local')
    
    // En desarrollo, lanzar error para que sea visible
    if (process.env.NODE_ENV === 'development') {
      throw new Error(errorMessage)
    }
  }
}

/**
 * Obtiene la URL de Supabase de forma segura
 * @throws Error si no está configurada
 */
export function getSupabaseUrl(): string {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }
  return env.NEXT_PUBLIC_SUPABASE_URL
}

/**
 * Obtiene la Anon Key de Supabase de forma segura
 * @throws Error si no está configurada
 */
export function getSupabaseAnonKey(): string {
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
  }
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

/**
 * Obtiene la Service Role Key de Supabase de forma segura
 * Solo para uso en Server Components/Actions
 * @throws Error si no está configurada
 */
export function getSupabaseServiceRoleKey(): string {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }
  return env.SUPABASE_SERVICE_ROLE_KEY
}

// Validar variables de entorno al importar el módulo
// Solo en desarrollo para no bloquear la app en producción si faltan algunas
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv()
  } catch (error) {
    // Error ya fue loggeado, continuar
  }
}

