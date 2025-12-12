/**
 * API Route: Verificar negocio (ADMIN) - BLOQUE 1
 * POST /api/admin/business/verificar
 * 
 * Verificar = Activar Premium manualmente
 * - Activa premium: is_premium = true
 * - Establece premium_until = now() + 30 días (o extiende si ya tiene)
 * - Actualiza max_photos = 10 (beneficio premium)
 * - Marca is_verified = true
 * - NO depende de pagos pendientes
 * - Asume que el pago fue verificado manualmente por el admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAdminAuth } from '@/utils/admin-auth'

/**
 * Calcular fecha de fin de premium
 * - Si ya tiene premium activo, extender desde la fecha actual
 * - Si no tiene premium, empezar desde ahora
 * - Duración por defecto: 30 días
 */
function calculatePremiumUntil(currentUntil?: string | null): Date {
  const now = new Date()
  const baseDate = currentUntil && new Date(currentUntil) > now
    ? new Date(currentUntil) // Extender desde la fecha actual si ya tiene premium
    : now // Empezar desde ahora si no tiene premium
  
  // Agregar 30 días
  baseDate.setDate(baseDate.getDate() + 30)
  return baseDate
}

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
      .select('id, name, is_premium, premium_until, owner_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    const now = new Date()
    
    // Calcular nueva fecha de premium (30 días desde ahora o extender si ya tiene)
    const newPremiumUntil = calculatePremiumUntil(business.premium_until)
    
    // Límite de fotos premium: 10 imágenes
    const PREMIUM_MAX_PHOTOS = 10

    // Actualizar el negocio: activar premium + verificación
    const { error: updateBusinessError } = await supabase
      .from('businesses')
      .update({
        is_premium: true,
        premium_until: newPremiumUntil.toISOString(),
        max_photos: PREMIUM_MAX_PHOTOS, // Beneficio premium: 10 fotos
        is_verified: true,
        verified_at: now.toISOString(),
        verified_by: user.id
      })
      .eq('id', businessId)

    if (updateBusinessError) {
      // Si algún campo no existe, retornar error informativo
      if (updateBusinessError.code === '42703') { // Column does not exist
        return NextResponse.json(
          { 
            success: false, 
            error: 'Campos requeridos no existen. Ejecuta el script add-admin-fields-businesses.sql primero.' 
          },
          { status: 500 }
        )
      }
      
      console.error('Error actualizando negocio:', updateBusinessError)
      return NextResponse.json(
        { success: false, error: 'Error al activar premium en el negocio' },
        { status: 500 }
      )
    }

    // Si ya era premium, el mensaje indica que se extendió
    const wasAlreadyPremium = business.is_premium && 
                               business.premium_until && 
                               new Date(business.premium_until) > now

    return NextResponse.json({
      success: true,
      message: wasAlreadyPremium
        ? `Premium extendido para "${business.name}" hasta ${newPremiumUntil.toLocaleDateString('es-ES')}`
        : `Premium activado para "${business.name}" hasta ${newPremiumUntil.toLocaleDateString('es-ES')}`,
      data: {
        is_premium: true,
        premium_until: newPremiumUntil.toISOString(),
        max_photos: PREMIUM_MAX_PHOTOS,
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

