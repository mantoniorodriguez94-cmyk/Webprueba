// /src/app/api/admin/subscriptions/extend/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

export async function POST(req: Request) {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()
    
    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { error: "No autorizado - Se requieren permisos de administrador" },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await req.json()

    const { subscriptionId, days } = body

    if (!subscriptionId || !days) {
      return NextResponse.json(
        { error: "subscriptionId y days son requeridos" },
        { status: 400 }
      )
    }

  // 2. Obtener la suscripción
  const { data: subscription, error: subError } = await supabase
    .from("business_subscriptions")
    .select("business_id, end_date, plan_id")
    .eq("id", subscriptionId)
    .single()

  if (subError || !subscription) {
    return NextResponse.json(
      { error: "Suscripción no encontrada" },
      { status: 404 }
    )
  }

  // 3. Calcular nueva fecha
  const oldEnd = new Date(subscription.end_date)
  const newEnd = new Date(oldEnd.getTime() + days * 86400000)

  // 4. Actualizar business_subscriptions
  const { error: updateSubError } = await supabase
    .from("business_subscriptions")
    .update({
      end_date: newEnd.toISOString(),
      status: "active"
    })
    .eq("id", subscriptionId)

  if (updateSubError) {
    return NextResponse.json(
      { error: "Error actualizando suscripción" },
      { status: 500 }
    )
  }

  // 5. Actualizar tabla businesses
  const { error: businessError } = await supabase
    .from("businesses")
    .update({
      is_premium: true,
      premium_until: newEnd.toISOString(),
      premium_plan_id: subscription.plan_id
    })
    .eq("id", subscription.business_id)

  if (businessError) {
    return NextResponse.json(
      { error: "Error actualizando el negocio" },
      { status: 500 }
    )
  }

    return NextResponse.json(
      {
        message: `Suscripción extendida exitosamente +${days} días`,
        new_end_date: newEnd.toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error en extend subscription:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
