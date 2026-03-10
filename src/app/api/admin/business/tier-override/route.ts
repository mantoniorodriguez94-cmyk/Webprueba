/**
 * API Route: Manual tier override (ADMIN)
 * POST /api/admin/business/tier-override
 * Updates the business owner's subscription_tier in profiles (Básico, Conecta, Destaca, Fundador)
 * and syncs main benefits package on the target business.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { cookies } from "next/headers"
import { getAdminClient } from "@/lib/supabase/admin"

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

    const cookieStore = await cookies()
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

    const supabase = getAdminClient()
    const { data: business, error: fetchErr } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .single()

    if (fetchErr || !business || !(business as any).owner_id) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado o sin propietario" },
        { status: 404 }
      )
    }

    const businessRow = business as { id: string; name?: string | null; owner_id?: string | null }

    // Update subscription_tier AND clear any stale subscription_end_date.
    // Admin-granted tiers via this quick-select are indefinite (null end date).
    // An old expired end date would make useMembershipAccess think the tier is inactive
    // even though we just granted it, so we must always null it out here.
    const { error: updateErr } = await supabase
      .from("profiles")
      // @ts-ignore - tipos generados pueden no incluir subscription_tier / subscription_end_date
      .update({ subscription_tier: tierNum, subscription_end_date: null })
      // @ts-ignore
      .eq("id", businessRow.owner_id)

    if (updateErr) {
      console.error("[tier-override] Error updating profiles:", updateErr)
      return NextResponse.json(
        { success: false, error: "Error al actualizar el tier del propietario" },
        { status: 500 }
      )
    }

    // Sincronizar paquete de beneficios en el negocio objetivo según tier
    let businessUpdates: Record<string, unknown> | null = null
    if (tierNum === 3) {
      // Fundador: paquete completo
      businessUpdates = {
        is_premium: true,
        premium_until: null,   // indefinite admin grant
        has_gold_border: true,
        search_priority_boost: true,
        is_featured: true,
        chat_enabled: true,
      }
    } else if (tierNum === 2) {
      // Destaca: premium + chat + spotlight, sin borde dorado
      businessUpdates = {
        is_premium: true,
        premium_until: null,
        has_gold_border: false,
        search_priority_boost: true,
        is_featured: true,
        chat_enabled: true,
      }
    } else if (tierNum === 1) {
      // Conecta: premium + chat básico, sin borde ni spotlight
      businessUpdates = {
        is_premium: true,
        premium_until: null,
        has_gold_border: false,
        search_priority_boost: false,
        is_featured: false,
        chat_enabled: true,
      }
    } else {
      // Básico (0): sin beneficios
      businessUpdates = {
        is_premium: false,
        premium_until: null,
        has_gold_border: false,
        search_priority_boost: false,
        is_featured: false,
        chat_enabled: false,
      }
    }

    // businessUpdates is always set for every tier, apply unconditionally
    const { error: businessUpdateErr } = await supabase
      .from("businesses")
      // @ts-ignore - algunas columnas pueden no estar en los tipos generados
      .update(businessUpdates)
      .eq("id", businessId)

    if (businessUpdateErr) {
      console.error("[tier-override] Error sincronizando beneficios en negocio:", businessUpdateErr)
      // Non-fatal: profiles was already updated; log and continue
    }

    const labels: Record<number, string> = {
      0: "Básico",
      1: "Conecta",
      2: "Destaca",
      3: "Fundador",
    }
    return NextResponse.json({
      success: true,
      message: `Tier del propietario de "${(businessRow as { name?: string }).name ?? "Negocio"}" actualizado a ${
        labels[tierNum]
      }.`,
      data: { owner_id: businessRow.owner_id, subscription_tier: tierNum },
    })
  } catch (err: unknown) {
    console.error("Error en tier-override:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
