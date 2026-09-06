/**
 * API Route: Desactivar premium de un NEGOCIO (ADMIN)
 * POST  { businessId }
 *
 * Antes esta ruta operaba sobre business_subscriptions (producto "Negocio
 * Premium", eliminado). Ahora actúa directamente sobre los flags espejo del
 * negocio: businesses.is_premium / premium_until.
 *
 * NOTA: esto NO cambia el nivel de la CUENTA (profiles.subscription_tier). Para
 * quitar un nivel de membresía usa /api/admin/profile-perks (reset_plan).
 *
 * ⚠️ El nombre de archivo es `rroute.ts` (typo histórico), por lo que Next.js NO
 * registra esta ruta. Se mantiene tal cual porque renombrarlo está fuera de
 * alcance; ninguna parte de la app la invoca actualmente.
 */

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
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 })
    }

    // Verificar que el negocio existe
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    const now = new Date()

    const { error: updateErr } = await supabase
      .from("businesses")
      // @ts-ignore - algunas columnas pueden no estar en los tipos generados
      .update({
        is_premium: false,
        premium_until: null
      })
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error desactivando premium del negocio:", updateErr)
      return NextResponse.json({ error: "Error desactivando premium del negocio" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Premium desactivado correctamente",
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
