/**
 * API Route: Verificar negocio (ADMIN) - BLOQUE 1
 * POST /api/admin/business/verificar
 * 
 * Verifica directamente un negocio (NO depende de pagos):
 * - Marca is_verified = true
 * - Guarda verified_at y verified_by
 * - NO modifica premium ni pagos
 * - Funciona siempre, independientemente de pagos pendientes
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

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, is_verified')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya está verificado
    if (business.is_verified) {
      return NextResponse.json({
        success: true,
        message: `Negocio "${business.name}" ya está verificado`,
        alreadyVerified: true
      })
    }

    const now = new Date()

    // Actualizar el negocio: solo verificación (NO toca premium ni pagos)
    const { error: updateBusinessError } = await supabase
      .from('businesses')
      .update({
        is_verified: true,
        verified_at: now.toISOString(),
        verified_by: user.id
      })
      .eq('id', businessId)

    if (updateBusinessError) {
      // Si el campo no existe, retornar error informativo
      if (updateBusinessError.code === '42703') { // Column does not exist
        return NextResponse.json(
          { 
            success: false, 
            error: 'Campo is_verified no existe. Ejecuta el script add-admin-fields-businesses.sql primero.' 
          },
          { status: 500 }
        )
      }
      
      console.error('Error actualizando negocio:', updateBusinessError)
      return NextResponse.json(
        { success: false, error: 'Error al verificar el negocio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Negocio "${business.name}" verificado exitosamente`,
      data: {
        is_verified: true,
        verified_at: now.toISOString(),
        verified_by: user.id
      }
    })

  } catch (error: any) {
    console.error('Error en verificar negocio:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

