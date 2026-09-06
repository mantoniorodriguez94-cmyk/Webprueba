/**
 * API Route: Manage a user's subscription tier (ADMIN)
 * POST /api/admin/profile-perks
 *
 * Supported actions:
 *   reset_plan  – Set subscription_tier=0, subscription_end_date=null
 *   assign_plan – Set subscription_tier + subscription_end_date = now + X days
 *
 * ─────────────────────────────────────────────
 * HISTORICAL NOTE: this route also offered à-la-carte perks
 * (set_golden_border / set_spotlight / set_promotions / set_chat) backed by
 * profiles.golden_border_expires_at, spotlight_expires_at,
 * promotions_expires_at, chat_expires_at and businesses.chat_enabled.
 * Those columns were DROPPED and the product decision is that every benefit
 * now derives from the account tier alone — no individual grants.
 * ─────────────────────────────────────────────
 * Security: requires checkAdminAuth() AND admin_master_ok cookie.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { applyTierBenefitsToBusinesses } from "@/lib/memberships/service"

const VALID_TIERS = [0, 1, 2, 3] as const
type ValidTier = (typeof VALID_TIERS)[number]

type PerkAction = "reset_plan" | "assign_plan"

const TIER_LABELS: Record<number, string> = {
  0: "Básico",
  1: "Conecta",
  2: "Destaca",
  3: "Patrocina",
}

function addDaysToNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function parseDays(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10)
  return Number.isFinite(n) && n >= 1 ? n : null
}

export async function POST(request: NextRequest) {
  try {
    // ── Layer 1: Admin Supabase auth ──────────────────────────────────────
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    // ── Layer 2: Master PIN cookie ────────────────────────────────────────
    const cookieStore = await cookies()
    const pinCookie = cookieStore.get("admin_master_ok")
    if (!pinCookie) {
      return NextResponse.json(
        { success: false, error: "PIN maestro requerido para esta acción." },
        { status: 403 }
      )
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await request.json().catch(() => ({}))
    const { profileId, action, days, tier } = body as {
      profileId?: string
      action?: PerkAction
      days?: unknown
      tier?: unknown
    }

    if (!profileId) {
      return NextResponse.json({ success: false, error: "profileId requerido" }, { status: 400 })
    }
    if (!action) {
      return NextResponse.json({ success: false, error: "action requerido" }, { status: 400 })
    }

    // Fresh client per request — avoids singleton stale-state issues
    const supabase = createAdminClient()
    const profileUpdates: Record<string, unknown> = {}
    // Tier a sincronizar en los negocios del usuario tras actualizar el perfil,
    // usando la función compartida applyTierBenefitsToBusinesses().
    let benefitsTier: number | null = null
    let benefitsUntil: string | undefined
    let successMessage = "Acción completada"

    // ── Build updates per action ──────────────────────────────────────────
    switch (action) {
      // ── 1. Reset plan to Básico ───────────────────────────────────────
      case "reset_plan": {
        profileUpdates.subscription_tier = 0
        profileUpdates.subscription_end_date = null
        benefitsTier = 0
        successMessage = "Plan reseteado a Básico. Se retiraron los beneficios de nivel."
        break
      }

      // ── 2. Assign specific plan + duration ────────────────────────────
      case "assign_plan": {
        const tierNum = typeof tier === "number" ? tier : parseInt(String(tier ?? ""), 10)
        if (!Number.isFinite(tierNum) || !VALID_TIERS.includes(tierNum as ValidTier)) {
          return NextResponse.json(
            { success: false, error: "tier debe ser 0, 1, 2 o 3" },
            { status: 400 }
          )
        }
        const daysNum = parseDays(days)
        if (!daysNum) {
          return NextResponse.json(
            { success: false, error: "days debe ser un número entero >= 1" },
            { status: 400 }
          )
        }

        const expiryDate = addDaysToNow(daysNum)
        profileUpdates.subscription_tier = tierNum
        profileUpdates.subscription_end_date = tierNum > 0 ? expiryDate : null

        // Los flags de negocio se sincronizan con la MISMA función que usan la
        // compra por PayPal y la aprobación de pago manual (una sola fuente de
        // verdad del mapa tier → beneficios).
        benefitsTier = tierNum
        benefitsUntil = tierNum > 0 ? expiryDate : undefined

        successMessage = `Plan ${TIER_LABELS[tierNum]} asignado por ${daysNum} días.`
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Acción desconocida: ${action}` },
          { status: 400 }
        )
    }

    // ── Apply profile updates ─────────────────────────────────────────────
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await supabase
        .from("profiles")
        // @ts-ignore — new expiry columns may not appear in generated types yet
        .update(profileUpdates)
        .eq("id", profileId)

      if (profileErr) {
        const errCode = (profileErr as any).code as string | undefined
        const errMsg = (profileErr as any).message as string | undefined
        console.error("[profile-perks] Error actualizando perfil:", {
          code: errCode,
          message: errMsg,
          details: (profileErr as any).details,
          hint: (profileErr as any).hint,
          action,
          profileUpdates,
        })
        if (errCode === "42703") {
          return NextResponse.json(
            {
              success: false,
              error:
                "Columna no encontrada en profiles (subscription_tier / subscription_end_date). Revisa el esquema de la base de datos.",
            },
            { status: 500 }
          )
        }
        return NextResponse.json(
          {
            success: false,
            error: `Error al actualizar el perfil (DB ${errCode ?? "?"}): ${errMsg ?? "error desconocido"}`,
          },
          { status: 500 }
        )
      }
    }

    // ── Sync tier benefits to all businesses of this profile ──────────────
    // `authoritative: true` → es un override de admin: los flags que el tier NO
    // otorga se limpian explícitamente (a diferencia de un pago, que solo suma).
    if (benefitsTier !== null) {
      await applyTierBenefitsToBusinesses(profileId, benefitsTier, {
        untilISO: benefitsUntil,
        authoritative: true,
      })
    }

    // Invalidate the admin usuarios page so the next RSC render shows fresh data
    revalidatePath('/app/admin/usuarios', 'page')

    return NextResponse.json({ success: true, message: successMessage })
  } catch (err: unknown) {
    console.error("[profile-perks] Error inesperado:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
