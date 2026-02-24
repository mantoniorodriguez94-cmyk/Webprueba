/**
 * API Route: Manual tier override (ADMIN)
 * POST /api/admin/business/tier-override
 * Updates the business owner's subscription_tier in profiles (Básico, Conecta, Destaca, Fundador).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { cookies } from "next/headers"

const VALID_TIERS = [0, 1, 2, 3] as const // Básico, Conecta, Destaca, Fundador

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const cookieStore = cookies()
    const pinCookie = cookieStore.get("admin_master_ok")
    if (!pinCookie) {
      return NextResponse.json(
        { success: false, error: "PIN maestro requerido para esta acción." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { businessId, tier } = body
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId requerido" },
        { status: 400 }
      )
    }
    const tierNum = typeof tier === "number" ? tier : parseInt(tier, 10)
    if (!Number.isFinite(tierNum) || !VALID_TIERS.includes(tierNum as 0 | 1 | 2 | 3)) {
      return NextResponse.json(
        { success: false, error: "tier debe ser 0 (Básico), 1 (Conecta), 2 (Destaca) o 3 (Fundador)" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: business, error: fetchErr } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business?.owner_id) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado o sin propietario" },
        { status: 404 }
      )
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: tierNum })
      .eq("id", business.owner_id)

    if (updateErr) {
      console.error("Error tier override:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el tier del propietario" },
        { status: 500 }
      )
    }

    // Manual tier change: extend business premium_until by 30 days from today
    const now = new Date()
    const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const { error: businessUpdateErr } = await supabase
      .from("businesses")
      .update({
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
      })
      .eq("id", businessId)

    if (businessUpdateErr) {
      console.error("Error extending premium_until on business:", businessUpdateErr)
      // Don't fail the request - tier was updated; only log
    }

    const labels: Record<number, string> = {
      0: "Básico",
      1: "Conecta",
      2: "Destaca",
      3: "Fundador",
    }
    return NextResponse.json({
      success: true,
      message: `Tier del propietario de "${business.name}" actualizado a ${labels[tierNum]}.`,
      data: { owner_id: business.owner_id, subscription_tier: tierNum },
    })
  } catch (err: unknown) {
    console.error("Error en tier-override:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
