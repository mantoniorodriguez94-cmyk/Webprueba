/**
 * API Route: Contar usuarios (ADMIN)
 * GET /api/admin/count-users
 * 
 * Cuenta todos los usuarios usando cliente admin para bypasear RLS
 */

import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    let usersCount = 0

    try {
      // Intentar auth.admin.listUsers() primero (más confiable)
      const { data: authData } = await adminSupabase.auth.admin.listUsers()
      usersCount = authData?.users?.length || 0
      console.log(`✅ ${usersCount} usuarios contados desde auth.admin.listUsers()`)
    } catch {
      // Fallback: contar desde profiles
      const { count, error } = await adminSupabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
      
      if (!error && count !== null) {
        usersCount = count
        console.log(`✅ ${usersCount} usuarios contados desde profiles (admin client)`)
      }
    }

    return NextResponse.json({
      success: true,
      count: usersCount
    })

  } catch (error: any) {
    console.error('Error en count-users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
