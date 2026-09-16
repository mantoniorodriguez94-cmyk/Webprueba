import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dominio canónico: encuentr.app y encuentrapp.com también resuelven a esta
// misma app, pero deben redirigir aquí (308) para que no cuenten como
// contenido duplicado ante buscadores.
//
// IMPORTANTE: Vercel ya redirige a nivel de borde appencuentra.com (bare) ->
// www.appencuentra.com ANTES de que este middleware corra. NO incluir
// 'www.appencuentra.com' aquí — hacerlo crea un loop infinito entre el
// redirect de Vercel (bare->www) y este middleware (www->bare).
const CANONICAL_HOST = 'appencuentra.com'
const REDIRECT_HOSTS = new Set([
  'encuentr.app',
  'www.encuentr.app',
  'encuentrapp.com',
  'www.encuentrapp.com',
])

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? ''

  if (REDIRECT_HOSTS.has(host)) {
    const canonicalUrl = new URL(request.url)
    canonicalUrl.hostname = CANONICAL_HOST
    canonicalUrl.port = ''
    canonicalUrl.protocol = 'https'
    return NextResponse.redirect(canonicalUrl, 308)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refrescar la sesión si es necesario
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica middleware SOLO a páginas,
     * excluyendo:
     * - api routes
     * - archivos estáticos
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 