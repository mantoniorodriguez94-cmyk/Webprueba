import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas en .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Mantener la sesión en localStorage (persiste incluso al cerrar el navegador)
    persistSession: true,
    storageKey: 'encuentra-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    
    // Detectar cambios de sesión automáticamente
    detectSessionInUrl: true,
    
    // Auto-refresh del token antes de que expire
    autoRefreshToken: true,
    
    // Flow de autenticación
    flowType: 'pkce'
  }
});
