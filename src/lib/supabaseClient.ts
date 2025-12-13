// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

// Creamos el cliente usando la librería SSR que sí maneja cookies
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
