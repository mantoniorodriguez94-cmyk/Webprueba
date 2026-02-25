/**
 * API Route: Reset user to free tier (ADMIN)
 * POST /api/admin/profile-reset
 *
 * - Sets profiles.subscription_tier = 0
 * - Resets ALL businesses for that profile:
 *   - is_verified = false
 *   - is_premium = false
 *   - has_gold_border = false
 *   - is_featured = false (spotlight)
 *   - search_priority_boost = false
 *   - chat_enabled = false
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const cookieStore = await cookies()
    const pinCookie = cookieStore.get("admin_master_ok")
    if (!pinCookie) {
      return NextResponse.json(
        { success: false, error: "PIN maestro requerido para esta acción." },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { profileId } = body as { profileId?: string }

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId requerido" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Asegurar que el perfil existe
    const { data: profile, error: profileFetchErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", profileId)
      .single()

    if (profileFetchErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Perfil no encontrado" },
        { status: 404 }
      )
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      // @ts-ignore - tipos generados pueden no incluir subscription_tier
      .update({ subscription_tier: 0 })
      .eq("id", profileId)

    if (profileErr) {
      console.error("[profile-reset] Error actualizando perfil:", profileErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el perfil a plan gratuito" },
        { status: 500 }
      )
    }

    const businessReset = {
      is_verified: false,
      is_premium: false,
      has_gold_border: false,
      is_featured: false,
      search_priority_boost: false,
      chat_enabled: false,
    }

    const { error: businessErr } = await supabase
      .from("businesses")
      // @ts-ignore - algunas columnas pueden no estar en los tipos generados
      .update(businessReset)
      .eq("owner_id", profileId)

    if (businessErr) {
      console.error("[profile-reset] Error reseteando negocios:", businessErr)
      return NextResponse.json(
        {
          success: false,
          error:
            "Perfil actualizado a plan gratuito, pero hubo un error al resetear los negocios. Revisa la consola del servidor.",
        },
        { status: 500 }
      )
    }

    const displayName = (profile as any).full_name || (profile as any).email || "Usuario"
    return NextResponse.json(
      {
        success: true,
        message: `Usuario "${displayName}" reseteado a Plan Gratis y negocios actualizados.`,
        data: {
          profileId,
          subscription_tier: 0,
        },
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error("[profile-reset] Error inesperado:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

