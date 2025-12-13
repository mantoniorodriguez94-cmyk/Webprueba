/**
 * API Route: Eliminar usuario (ADMIN)
 * DELETE /api/admin/users/delete
 * 
 * Elimina un usuario completamente del sistema:
 * - Elimina el perfil de la tabla profiles
 * - Elimina el usuario de auth.users
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'

export async function DELETE(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }

    // No permitir que un admin se elimine a sí mismo
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      )
    }

    // Usar service role key para eliminar el usuario
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'Configuración de Supabase no disponible' },
        { status: 500 }
      )
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
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

    // 1. Eliminar el perfil de la tabla profiles
    const { error: profileDeleteError } = await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.error('Error eliminando perfil:', profileDeleteError)
      // Continuar aunque falle, puede que no exista el perfil
    }

    // 2. Eliminar el usuario de auth.users
    const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Error eliminando usuario de auth:', authDeleteError)
      return NextResponse.json(
        { success: false, error: `Error al eliminar usuario: ${authDeleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error en delete user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

