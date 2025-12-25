import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener el negocio y verificar permisos
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*, owner_id, is_premium, premium_until, golden_border_active")
      .eq("id", businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el propietario
    const isOwner = business.owner_id === user.id
    const isAdmin = user.user_metadata?.is_admin ?? false

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar este negocio" },
        { status: 403 }
      )
    }

    // Verificar que el negocio es premium y está activo
    if (!business.is_premium || new Date(business.premium_until) < new Date()) {
      return NextResponse.json(
        { error: "Este negocio no tiene una membresía premium activa" },
        { status: 400 }
      )
    }

    const currentlyActive = business.golden_border_active

    // Si está intentando activar el borde dorado
    if (!currentlyActive) {
      // Obtener el límite de bordes dorados según la membresía
      const { data: limitData, error: limitError } = await supabase
        .rpc('get_golden_border_limit', { p_user_id: user.id })

      if (limitError) {
        console.error("Error obteniendo límite:", limitError)
        return NextResponse.json(
          { error: "Error al verificar el límite de bordes dorados" },
          { status: 500 }
        )
      }

      const limit = limitData as number

      if (limit === 0) {
        return NextResponse.json(
          { error: "No tienes una membresía activa para activar el borde dorado" },
          { status: 400 }
        )
      }

      // Contar bordes dorados actualmente activos
      const { data: activeCountData, error: countError } = await supabase
        .rpc('count_user_active_golden_borders', { p_user_id: user.id })

      if (countError) {
        console.error("Error contando bordes activos:", countError)
        return NextResponse.json(
          { error: "Error al verificar bordes dorados activos" },
          { status: 500 }
        )
      }

      const activeCount = activeCountData as number

      // Verificar si ha alcanzado el límite
      if (activeCount >= limit) {
        const membershipType = limit === 1 ? "mensual" : "anual"
        return NextResponse.json(
          { 
            error: `Has alcanzado el límite de bordes dorados para tu membresía ${membershipType}`,
            limit,
            activeCount,
            canActivate: false
          },
          { status: 400 }
        )
      }

      // Activar el borde dorado
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ golden_border_active: true })
        .eq("id", businessId)

      if (updateError) {
        console.error("Error activando borde dorado:", updateError)
        return NextResponse.json(
          { error: "Error al activar el borde dorado" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Borde dorado activado exitosamente",
        golden_border_active: true,
        activeCount: activeCount + 1,
        limit
      })

    } else {
      // Desactivar el borde dorado
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ golden_border_active: false })
        .eq("id", businessId)

      if (updateError) {
        console.error("Error desactivando borde dorado:", updateError)
        return NextResponse.json(
          { error: "Error al desactivar el borde dorado" },
          { status: 500 }
        )
      }

      // Obtener el conteo actualizado
      const { data: activeCountData } = await supabase
        .rpc('count_user_active_golden_borders', { p_user_id: user.id })

      const activeCount = (activeCountData as number) || 0

      return NextResponse.json({
        success: true,
        message: "Borde dorado desactivado exitosamente",
        golden_border_active: false,
        activeCount,
        limit: await supabase.rpc('get_golden_border_limit', { p_user_id: user.id }).then((r: any) => r.data as number)
      })
    }

  } catch (error: any) {
    console.error("Error en toggle-golden-border:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// GET: Obtener información sobre el estado del borde dorado y límites
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener información del negocio
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("owner_id, is_premium, premium_until, golden_border_active")
      .eq("id", businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      )
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // Obtener límite y conteo actual
    const { data: limitData } = await supabase
      .rpc('get_golden_border_limit', { p_user_id: user.id })
    
    const { data: activeCountData } = await supabase
      .rpc('count_user_active_golden_borders', { p_user_id: user.id })

    const limit = (limitData as number) || 0
    const activeCount = (activeCountData as number) || 0

    return NextResponse.json({
      golden_border_active: business.golden_border_active,
      is_premium: business.is_premium,
      premium_until: business.premium_until,
      limit,
      activeCount,
      canActivate: !business.golden_border_active && activeCount < limit,
      membershipType: limit === 1 ? "monthly" : limit === 2 ? "yearly" : "none"
    })

  } catch (error: any) {
    console.error("Error en GET toggle-golden-border:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

