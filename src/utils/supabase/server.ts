import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el servidor (Usuario normal)
 * 
 * Usa NEXT_PUBLIC_SUPABASE_ANON_KEY y maneja cookies para sesiones
 * Respetará las políticas RLS según el usuario autenticado
 */
export async function createClient() {
  const cookieStore = await cookies(); // 👈 El await es CRUCIAL en Next 15

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar error si se llama desde un Server Component
          }
        },
      },
    }
  );
}
