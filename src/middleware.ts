import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dominio canónico: www.appencuentra.com. Los demás dominios resuelven a esta
// misma app y deben redirigir aquí (308) para no contar como contenido
// duplicado ante los buscadores.
//
// El canónico es el que lleva www porque es el que Vercel sirve de verdad.
// Antes esta constante decía el dominio pelado mientras Vercel servía el www:
// las dos capas se contradecían, los otros dominios daban dos saltos en vez de
// uno (encuentr.app -> pelado -> www) y todo lo que se anunciaba —og:url,
// sitemap, robots— nombraba un host que no era el que respondía.
//
// El pelado SÍ va en la lista, y no crea loop: Vercel lo redirige a www en el
// borde, este middleware lo redirige a www también, y dos redirects en la
// misma dirección no se pelean. Está acá para que la canonicalización no
// dependa de una configuración de panel: si el redirect de Vercel se quita o
// se pierde en una migración, el middleware lo sigue cubriendo.
//
// Lo que NO puede entrar nunca es 'www.appencuentra.com' — apuntaría el
// canónico contra sí mismo y ahí sí hay loop infinito.
const CANONICAL_HOST = 'www.appencuentra.com'
const REDIRECT_HOSTS = new Set([
  'appencuentra.com',
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