/**
 * API Route: Listar pagos manuales (ADMIN)
 * GET /api/admin/payments/list?status=pending|approved|rejected
 * 
 * Lista los pagos manuales filtrados por estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { getLabelForTier } from '@/lib/memberships/tiers'
import type { SubscriptionTier } from '@/lib/memberships/tiers'

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Obtener el parámetro de status
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    // Validar status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    // Consultar pagos manuales.
    // Ya no existe premium_plans: el nivel comprado viene en la propia fila
    // (target_tier + months + amount_usd).
    // `business` sigue disponible pero business_id es NULLABLE (la membresía es
    // de la cuenta, no de un negocio), así que puede venir null.
    const { data, error } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error consultando pagos:', error)
      return NextResponse.json(
        { success: false, error: 'Error al consultar pagos' },
        { status: 500 }
      )
    }

    // Etiqueta legible del nivel comprado (Conecta / Destaca / Patrocina)
    if (data && data.length > 0) {
      data.forEach((s: any) => {
        s.tier_label = getLabelForTier(Number(s.target_tier ?? 0) as SubscriptionTier)
      })
    }

    // Obtener información de usuarios desde profiles
    if (data && data.length > 0) {
      const userIds = data.map((s: any) => s.user_id)
      const { data: profiles } = await (adminSupabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      
      // Mapear los perfiles a los submissions
      if (profiles) {
        const profileMap = new Map((profiles as any[]).map((p: any) => [p.id, p]))
        data.forEach((s: any) => {
          const profile = profileMap.get(s.user_id)
          s.user = profile ? { full_name: profile.full_name } : null
        })
      }
    }

    return NextResponse.json({
      success: true,
      submissions: data || [],
    })

  } catch (error: any) {
    console.error('Error en list payments:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
