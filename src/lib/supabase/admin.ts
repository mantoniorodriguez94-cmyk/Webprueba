/**
 * Cliente de Supabase para Administradores
 * 
 * Este cliente usa SUPABASE_SERVICE_ROLE_KEY para bypass RLS y acceder
 * a funcionalidades administrativas como auth.admin.listUsers()
 * 
 * ⚠️ IMPORTANTE:
 * - Solo usar en Server Components/Actions
 * - NUNCA exponer este cliente al cliente (browser)
 * - Este cliente tiene permisos elevados y bypassa RLS
 */

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/env'

let adminClient: ReturnType<typeof createClient> | null = null

/**
 * Obtiene el cliente de Supabase con permisos de administrador
 * Usa Service Role Key para bypass RLS
 * 
 * @returns Cliente de Supabase con permisos elevados
 */
export function getAdminClient() {
  // Reutilizar el cliente si ya existe (singleton pattern)
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

/**
 * Crea un nuevo cliente admin (útil cuando necesitas uno fresco)
 * @returns Nuevo cliente de Supabase con permisos de administrador
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

