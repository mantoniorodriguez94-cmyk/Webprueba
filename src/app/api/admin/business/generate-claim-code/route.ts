/**
 * API Route: Generar código de reclamación (ADMIN)
 * POST /api/admin/business/generate-claim-code
 * 
 * Genera un código único para reclamar un negocio.
 * Solo los administradores pueden generar códigos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'

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

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    // Verificar que el negocio existe
    const { data: business, error: businessError } = await adminSupabase
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

    // Verificar si ya existe un código activo para este negocio
    const { data: existingClaim, error: existingError } = await adminSupabase
      .from('business_claims')
      .select('id, code, is_claimed')
      .eq('business_id', businessId)
      .eq('is_claimed', false)
      .maybeSingle()

    // Si hay un código activo, retornarlo en lugar de crear uno nuevo
    const claim = existingClaim as any
    if (claim && !claim.is_claimed) {
      return NextResponse.json({
        success: true,
        message: 'Código activo encontrado',
        data: {
          code: claim.code,
          business_id: businessId,
          business_name: (business as any).name,
          is_new: false
        }
      })
    }

    // Generar nuevo código usando la función SQL
    const { data: codeData, error: codeError } = await adminSupabase.rpc('generate_claim_code')

    if (codeError || !codeData) {
      console.error('Error generando código:', codeError)
      return NextResponse.json(
        { success: false, error: 'Error al generar código único' },
        { status: 500 }
      )
    }

    const newCode = codeData as string

    // Insertar el código en business_claims
    const { data: claimData, error: insertError } = await adminSupabase
      .from('business_claims')
      .insert({
        business_id: businessId,
        code: newCode,
        is_claimed: false
      } as any)
      .select('id, code, created_at')
      .single()

    if (insertError || !claimData) {
      console.error('Error insertando código:', insertError)
      return NextResponse.json(
        { success: false, error: 'Error al guardar el código' },
        { status: 500 }
      )
    }

    const claimResult = claimData as any

    return NextResponse.json({
      success: true,
      message: 'Código generado exitosamente',
      data: {
        code: claimResult.code,
        business_id: businessId,
        business_name: (business as any).name,
        created_at: claimResult.created_at,
        is_new: true
      }
    })

  } catch (error: any) {
    console.error('Error en generate-claim-code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
