/**
 * API Route: Contar usuarios (ADMIN)
 * GET /api/admin/count-users
 * 
 * Cuenta todos los usuarios usando service role key para bypasear RLS
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAdminAuth } from '@/utils/admin-auth'

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

    let usersCount = 0

    // Usar service role key si está disponible
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        // Contar desde profiles usando service role (sin RLS)
        const { count, error } = await serviceSupabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
        
        if (!error && count !== null) {
          usersCount = count
        } else {
          // Fallback: usar auth.admin.listUsers()
          const { data: authData } = await serviceSupabase.auth.admin.listUsers()
          usersCount = authData?.users?.length || 0
        }
      } catch (err: any) {
        console.error("Error contando usuarios con service role:", err)
      }
    } else {
      // Si no hay service role key, usar el cliente normal
      const supabase = await createClient()
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
      
      if (!error && count !== null) {
        usersCount = count
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

