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
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId requerido" }, { status: 400 })
    }

  // Obtener suscripción
  const { data: sub } = await supabase
    .from("business_subscriptions")
    .select("business_id")
    .eq("id", subscriptionId)
    .single()

  if (!sub) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 })

  const now = new Date()

  // Actualizar suscripción
  await supabase
    .from("business_subscriptions")
    .update({
      status: "expired",
      end_date: now.toISOString()
    })
    .eq("id", subscriptionId)

  // Actualizar negocio
  await supabase
    .from("businesses")
    .update({
      is_premium: false,
      premium_until: null,
      premium_plan_id: null
    })
    .eq("id", sub.business_id)

    return NextResponse.json({
      message: "Suscripción desactivada correctamente",
      deactivated_at: now.toISOString()
    })
  } catch (error: any) {
    console.error("Error en deactivate subscription:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
