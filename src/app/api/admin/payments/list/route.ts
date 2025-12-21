/**
 * API Route: Listar pagos manuales (ADMIN)
 * GET /api/admin/payments/list?status=pending|approved|rejected
 * 
 * Lista los pagos manuales filtrados por estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Crear cliente de Supabase admin
    const supabase = createAdminClient()
    
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

    // TODO: Verificar que el usuario es admin
    // Implementar según tu lógica de autenticación

    // Consultar pagos manuales
    const { data, error } = await supabase
      .from('manual_payment_submissions')
      .select(`
        *,
        business:businesses(name),
        plan:premium_plans(name, price_usd)
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

    // Obtener información de usuarios desde profiles
    if (data && data.length > 0) {
      const userIds = data.map((s: any) => s.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      
      // Mapear los perfiles a los submissions
      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.id, p]))
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

