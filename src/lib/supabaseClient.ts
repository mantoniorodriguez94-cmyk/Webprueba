// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para el navegador (Usuario normal)
 * 
 * Usa NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Respetará las políticas RLS según el usuario autenticado
 * 
 * ⚠️ Nota: No validamos env aquí porque estas variables son públicas
 * y se exponen al navegador de todas formas (NEXT_PUBLIC_*)
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
