import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route - Maneja OAuth redirects (Google, etc.)
 * 
 * Flujo:
 * 1. Google redirige aquí con un código
 * 2. Intercambiamos el código por una sesión
 * 3. Verificamos/creamos el perfil
 * 4. Redirigimos al dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Manejar errores de OAuth (usuario canceló, etc.)
  if (error) {
    console.error('❌ Error en OAuth callback:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/app/auth/login?error=${encodeURIComponent(errorDescription || error)}`,
        request.url
      )
    )
  }

  // Validar que tenemos un código
  if (!code) {
    console.error('❌ No se recibió código de autorización')
    return NextResponse.redirect(
      new URL('/app/auth/login?error=No se recibió código de autorización', request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Intercambiar código por sesión
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !session) {
      console.error('❌ Error intercambiando código por sesión:', exchangeError)
      return NextResponse.redirect(
        new URL(
          `/app/auth/login?error=${encodeURIComponent(exchangeError?.message || 'Error al iniciar sesión')}`,
          request.url
        )
      )
    }

    const userId = session.user.id

    // Verificar si el perfil existe
    // El trigger handle_new_user debería crear el perfil automáticamente,
    // pero esperamos un momento y verificamos como fallback
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single()

    // Si no existe perfil (error PGRST116 = no rows), crearlo manualmente como fallback
    // Esto es raro porque el trigger debería haberlo creado, pero es una medida de seguridad
    if (!profile && profileError?.code === 'PGRST116') {
      // Intentar crear el perfil manualmente
      // Obtener información del usuario de auth
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const userMetadata = user.user_metadata || {}
        const avatarUrl = userMetadata.avatar_url || userMetadata.picture || null
        const fullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || ''
        const email = user.email || ''
        
        // Intentar crear el perfil
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            email: email,
            role: userMetadata.role || 'person', // Default a 'person' para Google OAuth
            avatar_url: avatarUrl,
          })

        if (insertError) {
          console.warn('⚠️ No se pudo crear perfil manualmente:', insertError)
          // No bloquear el flujo, puede que el perfil ya exista o haya un problema de permisos
          // El trigger debería haberlo manejado, así que continuamos
        } else {
          console.log('✅ Perfil creado manualmente como fallback')
        }
      }
    }

    // Redirigir al dashboard usando URL absoluta
    // Extraer el origen de la request para construir la URL correcta
    const origin = requestUrl.origin
    const dashboardUrl = `${origin}/app/dashboard`
    
    console.log('✅ OAuth exitoso, redirigiendo a:', dashboardUrl)
    
    return NextResponse.redirect(dashboardUrl)

  } catch (err: any) {
    console.error('❌ Error inesperado en callback:', err)
    return NextResponse.redirect(
      new URL(
        `/app/auth/login?error=${encodeURIComponent(err?.message || 'Error inesperado')}`,
        request.url
      )
    )
  }
}

