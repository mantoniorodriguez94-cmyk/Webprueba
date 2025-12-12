/**
 * API Route: Suspender negocio (ADMIN)
 * POST /api/admin/business/suspender
 * 
 * Suspende un negocio (lo oculta del feed público)
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
      .select('id, name')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // BLOQUE 2: Suspender premium - Quitar is_premium, mantener historial
    // No eliminamos datos ni pagos históricos, solo quitamos el premium activo
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ 
        is_premium: false,
        // No tocamos premium_until para mantener el historial
        // No eliminamos suscripciones ni pagos
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Error suspendiendo negocio:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al suspender el premium del negocio' },
        { status: 500 }
      )
    }

    // Opcional: Marcar suscripción como cancelada (no eliminarla)
    await supabase
      .from('business_subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('business_id', businessId)
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      message: `Premium suspendido para "${business.name}". El negocio ya no tiene beneficios premium activos.`,
    })

  } catch (error: any) {
    console.error('Error en suspender negocio:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

