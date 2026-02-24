/**
 * API Route: Profile override (ADMIN)
 * POST /api/admin/profile-override
 * Updates subscription_tier and extra_business_limit for a profile.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

const VALID_TIERS = [0, 1, 2, 3]

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
    const { profileId, subscription_tier, extra_business_limit } = body
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId requerido" },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (typeof subscription_tier === "number" && VALID_TIERS.includes(subscription_tier)) {
      updates.subscription_tier = subscription_tier
    }
    if (typeof extra_business_limit === "number" && extra_business_limit >= 0) {
      updates.extra_business_limit = extra_business_limit
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Incluye subscription_tier (0-3) y/o extra_business_limit (>= 0)" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)

    if (updateErr) {
      console.error("Error profile-override:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el perfil" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: updates,
    })
  } catch (err: unknown) {
    console.error("Error en profile-override:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
