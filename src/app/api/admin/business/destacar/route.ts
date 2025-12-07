/**
 * API Route: Destacar negocio (ADMIN)
 * POST /api/admin/business/destacar
 * 
 * Destaca un negocio (lo muestra primero en búsquedas)
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
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el negocio existe
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, is_featured')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // Destacar el negocio (usar campo is_featured si existe, o crear uno)
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ 
        is_featured: true, // Si el campo existe
        // Si no existe, necesitarás agregarlo a la tabla
      })
      .eq('id', businessId)

    if (updateError) {
      // Si el campo no existe, retornar error informativo
      if (updateError.code === '42703') { // Column does not exist
        return NextResponse.json(
          { 
            success: false, 
            error: 'Campo is_featured no existe en la tabla businesses. Agrégalo primero.' 
          },
          { status: 500 }
        )
      }
      
      console.error('Error destacando negocio:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al destacar el negocio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Negocio "${business.name}" destacado exitosamente`,
    })

  } catch (error: any) {
    console.error('Error en destacar negocio:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

