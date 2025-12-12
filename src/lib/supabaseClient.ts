// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

// Creamos el cliente usando la librería SSR que sí maneja cookies
// Configurado con PKCE para mejor seguridad y soporte de recuperación de contraseña
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
)
