/**
 * API Route: Limpiar Premium y Destacados Expirados
 * POST /api/admin/cleanup-expired
 * 
 * Esta ruta ejecuta la función SQL que desactiva automáticamente:
 * - Negocios premium cuando premium_until < NOW()
 * - Negocios destacados cuando featured_until < NOW()
 * 
 * Puede ser llamada:
 * - Manualmente por un admin
 * - Por un cron job externo (Vercel Cron, GitHub Actions, etc.)
 * - Por Supabase Edge Function + pg_cron
 * 
 * ⚠️ IMPORTANTE: Debe ejecutarse diariamente para mantener los datos consistentes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAdminAuth } from '@/utils/admin-auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario es admin (opcional, puede ser llamada por cron también)
    // Si no hay autenticación, asumimos que es una llamada desde cron/externa
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || ''
    
    // Si hay un secret de cron y coincide, permitir sin auth
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Llamada desde cron, continuar
    } else {
      // Verificar que el usuario es admin
      const { user, error: authError } = await checkAdminAuth()
      
      if (authError || !user || !user.isAdmin) {
        return NextResponse.json(
          { success: false, error: 'No autorizado - Se requieren permisos de administrador o secret de cron válido' },
          { status: 403 }
        )
      }
    }

    const supabase = await createClient()

    // Ejecutar la función SQL que limpia premium y destacados expirados
    const { data, error } = await supabase.rpc('cleanup_expired_premium_and_featured')

    if (error) {
      // Si la función no existe, intentar la versión simple
      if (error.message.includes('function') || error.code === '42883') {
        console.warn('⚠️ Función cleanup_expired_premium_and_featured no existe, intentando versión simple...')
        
        const { error: simpleError } = await supabase.rpc('cleanup_expired_premium_and_featured_simple')
        
        if (simpleError) {
          console.error('Error ejecutando limpieza (versión simple):', simpleError)
          return NextResponse.json(
            { success: false, error: `Error ejecutando limpieza: ${simpleError.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Limpieza de premium y destacados expirados ejecutada exitosamente (versión simple)',
          data: {
            premium_expired_count: null,
            featured_expired_count: null,
            note: 'Ejecutado con función simple (sin conteo)'
          }
        })
      }

      console.error('Error ejecutando limpieza:', error)
      return NextResponse.json(
        { success: false, error: `Error ejecutando limpieza: ${error.message}` },
        { status: 500 }
      )
    }

    const result = Array.isArray(data) && data.length > 0 ? data[0] : data

    return NextResponse.json({
      success: true,
      message: 'Limpieza de premium y destacados expirados ejecutada exitosamente',
      data: {
        premium_expired_count: result?.premium_expired_count || 0,
        featured_expired_count: result?.featured_expired_count || 0
      }
    })

  } catch (error: any) {
    console.error('Error en limpieza de expirados:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Permitir GET para verificar que la ruta funciona (solo para admins)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ruta de limpieza disponible. Usa POST para ejecutar la limpieza.',
      endpoint: '/api/admin/cleanup-expired',
      method: 'POST'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

