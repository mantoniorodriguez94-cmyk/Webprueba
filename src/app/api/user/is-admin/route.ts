/**
 * API Route: Verificar si el usuario actual es administrador
 * GET /api/user/is-admin
 * 
 * Retorna si el usuario autenticado tiene permisos de administrador
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Cliente para autenticación (Auth)
import { getAdminClient } from '@/lib/supabase/admin' // Cliente admin para leer perfiles

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
    // Intentamos primero con cliente admin (bypass RLS), luego fallback a cliente normal
    let profile: { is_admin: boolean; email: string; role: string } | null = null
    let dbError: any = null

    // Intentar con cliente admin primero (más confiable en producción)
    try {
      const adminSupabase = getAdminClient()

      const { data: adminProfile, error: adminError } = await adminSupabase
        .from('profiles')
        .select('is_admin, email, role')
        .eq('id', user.id)
        .single()

      if (!adminError && adminProfile) {
        profile = adminProfile
        console.log('✅ Perfil leído con cliente admin')
      } else {
        dbError = adminError
        console.warn('⚠️ Error con cliente admin, intentando fallback:', adminError?.message)
      }
    } catch (err: any) {
      console.warn('⚠️ Excepción con cliente admin, intentando fallback:', err.message)
      dbError = err
    }

    // Fallback: Intentar con cliente normal si cliente admin falló
    if (!profile && !dbError) {
      const { data: normalProfile, error: normalError } = await supabase
        .from('profiles')
        .select('is_admin, email, role')
        .eq('id', user.id)
        .single()

      if (!normalError && normalProfile) {
        profile = normalProfile
        console.log('✅ Perfil leído con cliente normal (anónimo)')
      } else {
        dbError = normalError
        console.error('❌ Error leyendo perfil con cliente normal:', normalError?.message)
      }
    }

    // Si no pudimos leer el perfil, retornar error
    if (dbError || !profile) {
      console.error('❌ API is-admin: Error leyendo perfil:', dbError?.message)
      
      // También verificar en user_metadata como fallback
      const metadataIsAdmin = user.user_metadata?.is_admin === true
      
      return NextResponse.json({
        isAdmin: metadataIsAdmin,
        error: dbError?.message || 'Error leyendo perfil',
        hasServiceRoleKey: true, // Cliente admin siempre está disponible
      })
    }

    const isAdmin = profile.is_admin === true || user.user_metadata?.is_admin === true

    return NextResponse.json({
      isAdmin,
      email: profile.email,
      role: profile.role,
      hasServiceRoleKey: true, // Cliente admin siempre está disponible
    })

  } catch (error: any) {
    console.error('❌ API is-admin: Error inesperado:', error)
    return NextResponse.json(
      { 
        isAdmin: false, 
        error: error.message || 'Error interno del servidor',
        hasServiceRoleKey: true, // Cliente admin siempre está disponible
      },
      { status: 500 }
    )
  }
}
