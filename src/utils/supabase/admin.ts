import { createClient } from '@supabase/supabase-js'

/**
 * Crea un cliente de Supabase con service role key para operaciones admin
 * Este cliente bypasea RLS y debe usarse solo en API routes del servidor
 * 
 * IMPORTANTE: Se crea de forma lazy para evitar errores durante el build
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL o Service Key no configuradas')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
