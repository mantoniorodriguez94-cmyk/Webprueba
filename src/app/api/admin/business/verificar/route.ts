/**
 * API Route: Verificar negocio (ADMIN)
 * POST /api/admin/business/verificar
 * 
 * Marca un negocio como verificado
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
      .select('id, name, is_verified')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el negocio como verificado
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ is_verified: true })
      .eq('id', businessId)

    if (updateError) {
      console.error('Error verificando negocio:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al verificar el negocio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Negocio "${business.name}" verificado exitosamente`,
    })

  } catch (error: any) {
    console.error('Error en verificar negocio:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

