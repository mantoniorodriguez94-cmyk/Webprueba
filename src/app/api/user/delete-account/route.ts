/**
 * API Route: Eliminar cuenta de usuario
 * POST /api/user/delete-account
 * 
 * Elimina completamente la cuenta del usuario autenticado:
 * - Elimina el usuario de auth.users
 * - El perfil se elimina automáticamente (CASCADE)
 * - Todos los datos relacionados se eliminan (CASCADE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // IMPORTANTE: Para eliminar un usuario de auth.users, necesitamos usar el Admin API
    // Esto requiere el SERVICE_ROLE_KEY (solo en servidor, nunca en cliente)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado')
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Crear cliente con service role para poder eliminar usuarios
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Eliminar el usuario (esto eliminará automáticamente el perfil por CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('❌ Error eliminando usuario:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la cuenta. Por favor, contacta al soporte.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    })

  } catch (error: any) {
    console.error('❌ Error en delete-account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

