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

  // Obtener suscripción + plan
  const { data: sub } = await supabase
    .from("business_subscriptions")
    .select("business_id, plan_id, premium_plans(duration_days)")
    .eq("id", subscriptionId)
    .single()

  if (!sub) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 })

  const duration = sub.premium_plans?.[0]?.duration_days ?? 30
  const now = new Date()
  const newEnd = new Date(now.getTime() + duration * 86400000)

  // Actualizar suscripción
  await supabase
    .from("business_subscriptions")
    .update({
      status: "active",
      start_date: now.toISOString(),
      end_date: newEnd.toISOString()
    })
    .eq("id", subscriptionId)

  // Actualizar negocio
  await supabase
    .from("businesses")
    .update({
      is_premium: true,
      premium_until: newEnd.toISOString(),
      premium_plan_id: sub.plan_id
    })
    .eq("id", sub.business_id)

    return NextResponse.json({
      message: "Suscripción activada correctamente",
      end_date: newEnd.toISOString()
    })
  } catch (error: any) {
    console.error("Error en activate subscription:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
