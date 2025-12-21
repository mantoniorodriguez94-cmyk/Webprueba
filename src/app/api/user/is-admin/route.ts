import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Cliente para autenticación (Auth)
import { createClient as createServiceClient } from '@supabase/supabase-js' // Cliente para base de datos (Admin)

export async function GET() {
  try {
    // 1️⃣ PASO 1: Identificar al usuario (Usamos cliente normal)
    // Necesitamos verificar quién hace la petición leyendo las cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ API is-admin: Usuario no autenticado')
      return NextResponse.json({ isAdmin: false, error: 'No autenticado' }, { status: 401 })
    }

    // 2️⃣ PASO 2: Leer la base de datos
    // Intentamos primero con Service Role (bypassa RLS), luego fallback a cliente normal
    let profile: { is_admin: boolean; email: string | null; role: string | null } | null = null
    let dbError: any = null

    // Intentar con Service Role primero (más confiable en producción)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        const { data: adminProfile, error: adminError } = await supabaseAdmin
          .from('profiles')
          .select('is_admin, email, role')
          .eq('id', user.id)
          .single()

        if (!adminError && adminProfile) {
          profile = adminProfile
          console.log('✅ Perfil leído con Service Role Key')
        } else {
          dbError = adminError
          console.warn('⚠️ Error con Service Role, intentando fallback:', adminError?.message)
        }
      } catch (err: any) {
        console.warn('⚠️ Excepción con Service Role, intentando fallback:', err.message)
        dbError = err
      }
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no configurada, usando cliente normal')
    }

    // Fallback: Intentar con cliente normal si Service Role falló o no está disponible
    // NOTA: Intentamos con cliente normal siempre que no tengamos perfil,
    // incluso si hubo un error con service role (como fallback adicional)
    if (!profile) {
      const { data: normalProfile, error: normalError } = await supabase
        .from('profiles')
        .select('is_admin, email, role')
        .eq('id', user.id)
        .single()

      if (!normalError && normalProfile) {
        profile = normalProfile
        dbError = null // Limpiar error previo si cliente normal funcionó
        console.log('✅ Perfil leído con cliente normal (anónimo)')
      } else if (!dbError) {
        // Solo actualizar error si no teníamos uno previo
        dbError = normalError
        console.error('❌ Error leyendo perfil con cliente normal:', normalError?.message)
      }
    }

    // Si no pudimos leer el perfil, retornar error
    if (!profile || dbError) {
      console.error('❌ No se pudo leer perfil:', {
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        error: dbError?.message || 'Perfil no encontrado',
        userId: user.id,
        email: user.email
      })
      return NextResponse.json({ 
        isAdmin: false, 
        error: dbError?.message || 'Perfil no encontrado',
        debug: {
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          errorCode: dbError?.code,
          errorMessage: dbError?.message
        }
      }, { status: 500 })
    }

    // 3️⃣ PASO 3: Validación estricta
    const isAdmin = profile.is_admin === true

    console.log(`✅ Verificación Admin completada: ${user.email} -> ${isAdmin ? 'ES ADMIN' : 'NO ES ADMIN'}`, {
      userId: user.id,
      email: user.email,
      is_admin: profile.is_admin,
      role: profile.role,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    return NextResponse.json({
      isAdmin,
      debug: {
        userId: user.id,
        email: profile.email,
        role: profile.role,
        is_admin_value: profile.is_admin,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error: any) {
    console.error('❌ Error fatal en API is-admin:', error)
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}