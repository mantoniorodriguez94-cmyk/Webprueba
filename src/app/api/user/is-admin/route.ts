/**
 * API Route: Verificar si el usuario actual es admin
 * GET /api/user/is-admin
 * 
 * ⚠️ IMPORTANTE: Esta ruta lee is_admin desde el servidor para evitar problemas de RLS
 * NO modifica ningún campo, solo lee el estado actual
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ No autenticado:', authError?.message)
      return NextResponse.json({
        isAdmin: false,
        error: 'No autenticado'
      })
    }

    console.log('🔍 Verificando admin para usuario:', user.id, user.email)

    // ⚠️ IMPORTANTE: Solo LECTURA, nunca UPDATE
    // Intentar leer is_admin desde el servidor
    let profile, profileError
    
    try {
      const result = await supabase
        .from('profiles')
        .select('is_admin, email, role')
        .eq('id', user.id)
        .single()
      
      profile = result.data
      profileError = result.error
    } catch (err: any) {
      profileError = err
    }

    // Si hay error de RLS, intentar con service role key como fallback
    if (profileError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ Error con cliente normal, intentando con service role:', profileError.message)
      
      try {
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: serviceProfile, error: serviceError } = await serviceSupabase
          .from('profiles')
          .select('is_admin, email, role')
          .eq('id', user.id)
          .single()
        
        if (!serviceError && serviceProfile) {
          profile = serviceProfile
          profileError = null
          console.log('✅ Lectura exitosa con service role')
        }
      } catch (serviceErr: any) {
        console.error('❌ Error incluso con service role:', serviceErr)
      }
    }

    if (profileError) {
      console.error('❌ Error leyendo perfil:', profileError)
      return NextResponse.json({
        isAdmin: false,
        error: profileError.message || 'Error al leer perfil',
        debug: {
          userId: user.id,
          email: user.email,
          errorCode: profileError.code,
          errorMessage: profileError.message
        }
      })
    }

    if (!profile) {
      console.error('❌ Perfil no encontrado para usuario:', user.id)
      return NextResponse.json({
        isAdmin: false,
        error: 'Perfil no encontrado'
      })
    }

    // Verificar is_admin de forma estricta (solo TRUE booleano)
    const isAdmin = profile.is_admin === true

    console.log('📊 Resultado verificación admin:', {
      userId: user.id,
      email: user.email,
      isAdmin,
      is_admin_value: profile.is_admin,
      role: profile.role
    })

    return NextResponse.json({
      isAdmin,
      error: null,
      debug: {
        userId: user.id,
        email: user.email,
        is_admin_value: profile.is_admin,
        role: profile.role
      }
    })

  } catch (error: any) {
    console.error('❌ Error en is-admin:', error)
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

