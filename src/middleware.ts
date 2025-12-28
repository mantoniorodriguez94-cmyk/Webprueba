import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const REFERRAL_COOKIE_NAME = 'encuentra_ref'
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días en segundos

export async function middleware(request: NextRequest) {
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

  // ============================================
  // SISTEMA DE REFERIDOS/AFILIADOS
  // ============================================
  // Capturar parámetro ?ref=partner_id y guardarlo en cookie
  const url = new URL(request.url)
  const refParam = url.searchParams.get('ref')

  if (refParam) {
    // Validar que el ref sea un UUID válido (opcional, pero recomendado)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(refParam)) {
      // Guardar en cookie (30 días, no HttpOnly para que el cliente pueda leerla, Secure en producción, SameSite=Lax)
      const cookieOptions: CookieOptions = {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        httpOnly: false, // Debe ser false para que el cliente pueda leerla en register
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      }
      
      response.cookies.set(REFERRAL_COOKIE_NAME, refParam, cookieOptions)

      // Limpiar el parámetro ?ref de la URL
      url.searchParams.delete('ref')
      
      // Redirigir a la URL limpia (sin ?ref)
      return NextResponse.redirect(url)
    }
  }

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