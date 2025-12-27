/**
 * API Route: Reclamar negocio mediante código
 * POST /api/business/claim
 * 
 * Permite a un usuario reclamar un negocio usando un código de invitación.
 * Esta acción usa la función SQL claim_business() que tiene SECURITY DEFINER
 * para poder transferir la propiedad del negocio.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para reclamar un negocio' },
        { status: 401 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Código requerido' },
        { status: 400 }
      )
    }

    const trimmedCode = code.trim().toUpperCase()

    // Llamar a la función SQL claim_business() que tiene SECURITY DEFINER
    // Esta función puede actualizar el owner_id sin que RLS lo bloquee
    const { data: result, error: claimError } = await supabase.rpc('claim_business', {
      p_code: trimmedCode,
      p_user_id: user.id
    })

    if (claimError) {
      console.error('Error en claim_business:', claimError)
      return NextResponse.json(
        { success: false, error: claimError.message || 'Error al reclamar el negocio' },
        { status: 500 }
      )
    }

    // La función retorna JSONB con success y error
    if (!result || !result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result?.error || 'No se pudo reclamar el negocio' 
        },
        { status: 400 }
      )
    }

    // Obtener información del negocio reclamado
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, is_founder')
      .eq('id', result.business_id)
      .single()

    if (businessError || !business) {
      console.error('Error obteniendo negocio:', businessError)
      // Aunque falló obtener el negocio, el claim fue exitoso
      return NextResponse.json({
        success: true,
        message: result.message || 'Negocio reclamado exitosamente',
        data: {
          business_id: result.business_id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Negocio reclamado exitosamente',
      data: {
        business_id: business.id,
        business_name: business.name,
        is_founder: business.is_founder
      }
    })

  } catch (error: any) {
    console.error('Error en claim business:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

