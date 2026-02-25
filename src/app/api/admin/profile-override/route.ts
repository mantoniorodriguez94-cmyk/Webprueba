/**
 * API Route: Profile override (ADMIN)
 * POST /api/admin/profile-override
 * Updates subscription_tier and extra_business_limit for a profile and syncs tier benefits to businesses.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"

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
    const { profileId, subscription_tier, extra_business_limit } = body as {
      profileId?: string
      subscription_tier?: number
      extra_business_limit?: number
    }

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

    const supabase = getAdminClient()
    const { error: updateErr } = await supabase
      .from("profiles")
      // @ts-ignore - tipos generados pueden no incluir estos campos opcionales
      .update(updates)
      .eq("id", profileId)

    if (updateErr) {
      console.error("Error profile-override:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el perfil" },
        { status: 500 }
      )
    }

    // Sincronizar beneficios de tier con TODOS los negocios del usuario
    if (typeof subscription_tier === "number" && VALID_TIERS.includes(subscription_tier)) {
      let businessUpdates: Record<string, unknown> | null = null

      if (subscription_tier === 3) {
        // Fundador: paquete completo
        businessUpdates = {
          is_premium: true,
          has_gold_border: true,
          search_priority_boost: true,
          is_featured: true, // Spotlight
          chat_enabled: true,
        }
      } else if (subscription_tier === 0) {
        // Básico: sin beneficios
        businessUpdates = {
          is_premium: false,
          has_gold_border: false,
          search_priority_boost: false,
          is_featured: false,
          chat_enabled: false,
        }
      }

      if (businessUpdates) {
        const { error: bizErr } = await supabase
          .from("businesses")
          // @ts-ignore - algunas columnas pueden no estar en los tipos generados
          .update(businessUpdates)
          .eq("owner_id", profileId)

        if (bizErr) {
          console.error("Error sincronizando beneficios de tier en negocios:", bizErr)
        }
      }
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

