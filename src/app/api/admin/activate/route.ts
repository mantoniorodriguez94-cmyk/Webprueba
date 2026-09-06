/**
 * API Route: Activar premium de un NEGOCIO (ADMIN)
 * POST /api/admin/activate  { businessId, days? }
 *
 * Antes esta ruta operaba sobre business_subscriptions (producto "Negocio
 * Premium", eliminado). Ahora actúa directamente sobre los flags espejo del
 * negocio: businesses.is_premium / premium_until.
 *
 * NOTA: esto NO cambia el nivel de la CUENTA (profiles.subscription_tier). Para
 * otorgar o quitar un nivel de membresía usa /api/admin/profile-perks
 * (assign_plan / reset_plan), que además sincroniza los beneficios del tier.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

const DEFAULT_PREMIUM_DAYS = 30

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
    const { businessId, days } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 })
    }

    const daysNum = Number(days)
    const duration = Number.isFinite(daysNum) && daysNum >= 1 ? Math.floor(daysNum) : DEFAULT_PREMIUM_DAYS

    // Verificar que el negocio existe
    const { data: business } = await supabase
      .from("businesses")
      .select("id, premium_until")
      .eq("id", businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    // Extender desde la fecha vigente si aún es futura; si no, desde ahora
    const now = new Date()
    const currentEnd = (business as any).premium_until
      ? new Date((business as any).premium_until)
      : now
    const base = currentEnd > now ? currentEnd : now
    const newEnd = new Date(base.getTime() + duration * 86400000)

    const { error: updateErr } = await supabase
      .from("businesses")
      // @ts-ignore - algunas columnas pueden no estar en los tipos generados
      .update({
        is_premium: true,
        premium_until: newEnd.toISOString(),
      })
      .eq("id", businessId)

    if (updateErr) {
      console.error("Error activando premium del negocio:", updateErr)
      return NextResponse.json({ error: "Error activando premium del negocio" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Premium activado por ${duration} días`,
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
