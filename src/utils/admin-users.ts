/**
 * Utilidades para obtener usuarios usando Service Role Key
 * Estas funciones solo funcionan en Server Components/Actions
 */

import { createClient } from '@supabase/supabase-js'

export interface UserData {
  id: string
  email: string | undefined
  full_name: string | null
  role: string
  is_admin: boolean
  created_at: string
  avatar_url: string | null
}

/**
 * Obtiene todos los usuarios usando auth.admin.listUsers()
 * Source of Truth: auth.users (no profiles)
 */
export async function getUsersFromAuth(): Promise<{
  users: UserData[]
  error: Error | null
  debugInfo: string[]
}> {
  const debugInfo: string[] = []
  const users: UserData[] = []

  try {
    // Verificar variables de entorno
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    debugInfo.push(`Service Role Key presente: ${!!serviceKey}`)
    debugInfo.push(`Supabase URL presente: ${!!supabaseUrl}`)

    if (!serviceKey || !supabaseUrl) {
      const error = new Error(
        'SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL no configuradas'
      )
      console.error('❌ Error: Variables de entorno faltantes:', {
        hasServiceKey: !!serviceKey,
        hasUrl: !!supabaseUrl,
      })
      debugInfo.push(`✗ Variables de entorno faltantes`)
      return { users: [], error, debugInfo }
    }

    // Crear cliente con service role
    const serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    debugInfo.push('✓ Cliente service role creado')

    // Obtener usuarios desde auth.admin.listUsers() - Source of Truth
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error en auth.admin.listUsers():', authError)
      debugInfo.push(`✗ auth.admin.listUsers() falló: ${authError.message}`)
      return { users: [], error: authError as Error, debugInfo }
    }

    if (!authData?.users) {
      const error = new Error('No se obtuvieron usuarios de auth.admin.listUsers()')
      debugInfo.push('✗ authData.users es null o undefined')
      return { users: [], error, debugInfo }
    }

    // Mapear usuarios de auth.users a formato UserData
    // Priorizar user_metadata, pero mostrar aunque falten datos
    const mappedUsers = authData.users.map((user): UserData => ({
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        null,
      role: user.user_metadata?.role || 'person',
      is_admin: user.user_metadata?.is_admin === true,
      created_at: user.created_at,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    }))

    debugInfo.push(`✓ ${mappedUsers.length} usuarios cargados desde auth.admin.listUsers()`)
    console.log(`✅ Usuarios cargados desde auth.users: ${mappedUsers.length}`)

    return { users: mappedUsers, error: null, debugInfo }
  } catch (err: any) {
    console.error('❌ Error inesperado en getUsersFromAuth():', err)
    debugInfo.push(`✗ Error inesperado: ${err.message}`)
    return { users: [], error: err as Error, debugInfo }
  }
}

/**
 * Cuenta usuarios usando auth.admin.listUsers()
 * Source of Truth: auth.users
 */
export async function countUsersFromAuth(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      console.error('❌ Variables de entorno faltantes para contar usuarios')
      return { count: 0, error: new Error('Variables de entorno no configuradas') }
    }

    const serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error contando usuarios:', authError)
      return { count: 0, error: authError as Error }
    }

    const count = authData?.users?.length || 0
    console.log(`✅ Usuarios contados desde auth.users: ${count}`)

    return { count, error: null }
  } catch (err: any) {
    console.error('❌ Error inesperado contando usuarios:', err)
    return { count: 0, error: err as Error }
  }
}

