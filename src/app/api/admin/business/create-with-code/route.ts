/**
 * API Route: Crear negocio sin dueño y generar código de reclamación (ADMIN)
 * POST /api/admin/business/create-with-code
 * 
 * Solo los administradores pueden crear negocios sin dueño (owner_id = NULL)
 * y generar un código único de reclamación automáticamente.
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
    const { 
      name, 
      description, 
      category, 
      address, 
      phone, 
      whatsapp,
      state_id,
      municipality_id,
      address_details
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre del negocio es requerido' },
        { status: 400 }
      )
    }

    if (!state_id || !municipality_id) {
      return NextResponse.json(
        { success: false, error: 'Estado y municipio son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Crear negocio sin owner_id (NULL) - Solo admins pueden hacer esto
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: null, // Negocio sin dueño
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        address: address?.trim() || null,
        phone: phone ? parseInt(phone.toString().replace(/\D/g, '')) : null,
        whatsapp: whatsapp ? parseInt(whatsapp.toString().replace(/\D/g, '')) : null,
        state_id: parseInt(state_id.toString()),
        municipality_id: parseInt(municipality_id.toString()),
        address_details: address_details?.trim() || null,
        is_founder: false, // Se establecerá cuando se reclame
      })
      .select('id, name')
      .single()

    if (businessError || !business) {
      console.error('Error creando negocio:', businessError)
      return NextResponse.json(
        { success: false, error: businessError?.message || 'Error al crear el negocio' },
        { status: 500 }
      )
    }

    // Generar código de reclamación automáticamente
    const { data: codeData, error: codeError } = await supabase.rpc('generate_claim_code')

    if (codeError || !codeData) {
      console.error('Error generando código:', codeError)
      // Si falla generar código, eliminar el negocio creado
      await supabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json(
        { success: false, error: 'Error al generar código único' },
        { status: 500 }
      )
    }

    const newCode = codeData as string

    // Insertar el código en business_claims
    const { data: claimData, error: insertError } = await supabase
      .from('business_claims')
      .insert({
        business_id: business.id,
        code: newCode,
        is_claimed: false,
        created_by: user.id
      })
      .select('id, code, created_at')
      .single()

    if (insertError || !claimData) {
      console.error('Error insertando código:', insertError)
      // Si falla insertar código, eliminar el negocio creado
      await supabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json(
        { success: false, error: 'Error al guardar el código' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Negocio creado exitosamente con código de reclamación',
      data: {
        business_id: business.id,
        business_name: business.name,
        code: claimData.code,
        created_at: claimData.created_at
      }
    })

  } catch (error: any) {
    console.error('Error en create-with-code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

