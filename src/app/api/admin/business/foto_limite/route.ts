/**
 * API Route: Aumentar límite de fotos (ADMIN)
 * POST /api/admin/business/foto_limite
 * 
 * Aumenta el límite de fotos permitidas para un negocio
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAdminAuth } from '@/utils/admin-auth'

export async function POST(request: NextRequest) {
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
    const { businessId, increment = 5 } = body

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el negocio existe y obtener su límite actual
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, max_photos')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // BLOQUE 4: Incrementar límite de fotos - Override administrativo
    // Si no tiene max_photos, usar el límite por defecto del plan o 5
    const currentLimit = business.max_photos || 5
    const incrementValue = typeof increment === 'number' ? increment : 5
    const newLimit = currentLimit + incrementValue

    // Actualizar el límite de fotos (override administrativo, sin pagos)
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ max_photos: newLimit })
      .eq('id', businessId)

    if (updateError) {
      // Si el campo no existe, retornar error informativo
      if (updateError.code === '42703') { // Column does not exist
        return NextResponse.json(
          { 
            success: false, 
            error: 'Campo max_photos no existe. Ejecuta el script add-admin-fields-businesses.sql primero.' 
          },
          { status: 500 }
        )
      }
      
      console.error('Error actualizando límite de fotos:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el límite de fotos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Límite de fotos actualizado para "${business.name}"`,
      data: {
        previousLimit: currentLimit,
        newLimit: newLimit
      }
    })

  } catch (error: any) {
    console.error('Error en aumentar límite de fotos:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

