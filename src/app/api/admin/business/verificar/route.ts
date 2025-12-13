/**
 * API Route: Verificar negocio = Activar Premium (ADMIN)
 * POST /api/admin/business/verificar
 * 
 * Activa premium para un negocio con la duración especificada:
 * - Activa is_premium = true
 * - Establece premium_until = now() + durationDays
 * - Actualiza max_photos según plan premium (10 por defecto)
 * - Si ya es premium, extiende la fecha de expiración
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
    const { businessId, durationDays } = body

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId requerido' },
        { status: 400 }
      )
    }

    // Validar durationDays (debe ser 30, 90, 180 o 365)
    const validDurations = [30, 90, 180, 365]
    const finalDurationDays = durationDays || 30 // Default a 30 días si no se especifica
    
    if (!validDurations.includes(finalDurationDays)) {
      return NextResponse.json(
        { success: false, error: 'Duración inválida. Debe ser 30, 90, 180 o 365 días' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, is_premium, premium_until')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // Calcular nueva fecha de expiración
    const now = new Date()
    let newPremiumUntil: Date

    // Si ya es premium y tiene fecha de expiración, extender desde esa fecha
    if (business.is_premium && business.premium_until) {
      const currentExpiry = new Date(business.premium_until)
      // Si la fecha actual es mayor que la de expiración, empezar desde ahora
      if (currentExpiry > now) {
        newPremiumUntil = new Date(currentExpiry.getTime() + finalDurationDays * 24 * 60 * 60 * 1000)
      } else {
        newPremiumUntil = new Date(now.getTime() + finalDurationDays * 24 * 60 * 60 * 1000)
      }
    } else {
      // Si no es premium, empezar desde ahora
      newPremiumUntil = new Date(now.getTime() + finalDurationDays * 24 * 60 * 60 * 1000)
    }

    // ⚠️ IMPORTANTE: Esta acción activa premium en businesses
    // NO debe modificar la tabla profiles, is_admin, role, ni ningún campo del perfil del usuario
    const { error: updateBusinessError } = await supabase
      .from('businesses')
      .update({
        is_premium: true,
        premium_until: newPremiumUntil.toISOString(),
        max_photos: 10 // Beneficio premium: 10 fotos
        // ⚠️ SEGURIDAD: Solo campos de premium del negocio. NO tocar:
        // - NO tocar tabla profiles
        // - NO tocar is_admin, role, ni campos del usuario
      })
      .eq('id', businessId)

    if (updateBusinessError) {
      console.error('Error actualizando negocio:', updateBusinessError)
      return NextResponse.json(
        { success: false, error: 'Error al activar premium' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Premium activado para "${business.name}" por ${finalDurationDays} días`,
      data: {
        is_premium: true,
        premium_until: newPremiumUntil.toISOString(),
        durationDays: finalDurationDays
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

