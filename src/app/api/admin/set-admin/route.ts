/**
 * API Route: Configurar usuario como admin (Solo con clave secreta)
 * POST /api/admin/set-admin
 * 
 * Esta ruta permite configurar un usuario como admin usando el service role key
 * Requiere una clave secreta para seguridad adicional
 * 
 * ⚠️ SOLO USAR EN CASOS ESPECIALES - Configurar admin cuando no tienes acceso directo a la BD
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Verificar clave secreta desde headers o body
    const { secret, email } = await request.json()

    // La clave secreta debe coincidir (configúrala en variables de entorno)
    const requiredSecret = process.env.ADMIN_SETUP_SECRET || 'temporary-setup-secret-change-me'
    
    if (secret !== requiredSecret) {
      return NextResponse.json(
        { success: false, error: 'Clave secreta inválida' },
        { status: 403 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido' },
        { status: 400 }
      )
    }

    // Verificar que tenemos las variables de entorno necesarias
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Variables de entorno de Supabase no configuradas' },
        { status: 500 }
      )
    }

    // Crear cliente con service role key (bypassa RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Buscar usuario por email
    const { data: { users }, error: findError } = await serviceSupabase.auth.admin.listUsers()
    
    if (findError) {
      return NextResponse.json(
        { success: false, error: `Error buscando usuario: ${findError.message}` },
        { status: 500 }
      )
    }

    const user = users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Usuario con email ${email} no encontrado` },
        { status: 404 }
      )
    }

    // Actualizar perfil en profiles
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        is_admin: true
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error actualizando profile:', profileError)
      // Continuar aunque falle, intentar actualizar metadata
    }

    // Actualizar metadata del usuario en auth.users
    const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          is_admin: true
        }
      }
    )

    if (metadataError) {
      return NextResponse.json(
        { success: false, error: `Error actualizando metadata: ${metadataError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} configurado como administrador exitosamente`,
      data: {
        userId: user.id,
        email: user.email
      }
    })

  } catch (error: any) {
    console.error('Error en set-admin:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

