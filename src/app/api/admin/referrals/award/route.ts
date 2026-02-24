/**
 * API Route: Award free month to referrer (ADMIN)
 * POST /api/admin/referrals/award
 * Extends the referrer's first business premium_until by 30 days and marks reward as claimed.
 * Expects table referral_rewards (id, user_id, created_at).
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId (del referidor) requerido" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", userId)
      .single()

    if (profError || !profile) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, premium_until")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)

    if (bizError || !businesses?.length) {
      return NextResponse.json(
        { success: false, error: "El referidor no tiene ningún negocio para asignar el mes gratis." },
        { status: 400 }
      )
    }

    const business = businesses[0]
    const now = new Date()
    const base = business.premium_until && new Date(business.premium_until) > now
      ? new Date(business.premium_until)
      : now
    const newUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { error: updateErr } = await supabase
      .from("businesses")
      .update({
        is_premium: true,
        premium_until: newUntil.toISOString(),
      })
      .eq("id", business.id)

    if (updateErr) {
      console.error("Error extending premium:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al extender premium del negocio" },
        { status: 500 }
      )
    }

    try {
      await supabase.from("referral_rewards").insert({
        user_id: userId,
      })
    } catch {
      // Table may not exist; reward still applied via premium_until
    }

    return NextResponse.json({
      success: true,
      message: `Mes gratis aplicado a "${profile.full_name || profile.email}". Negocio "${business.name}" con premium hasta ${newUntil.toLocaleDateString("es-ES")}.`,
      data: { business_id: business.id, premium_until: newUntil.toISOString() },
    })
  } catch (err: unknown) {
    console.error("Error en admin referrals award:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
