import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export function createClient() {
  const cookieStore = cookies()

  // NOTA IMPORTANTE:
  // ESTA FUNCIÓN NO ES async — debe devolver EL CLIENTE DIRECTAMENTE.

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.then(cookieStore => cookieStore.get(name)?.value ?? null)
        },
        set(name: string, value: string, options: any) {
          try { cookieStore.then(cookieStore => cookieStore.set(name, value, options)) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.then(cookieStore => cookieStore.set(name, "", { ...options, maxAge: 0 })) } catch {}
        }
      }
    }
  )
}
