/**
 * API Route: Manage modular user perks (ADMIN)
 * POST /api/admin/profile-perks
 *
 * Supported actions:
 *   reset_plan      – Set subscription_tier=0, subscription_end_date=null (perks unaffected)
 *   assign_plan     – Set subscription_tier + subscription_end_date = now + X days
 *   set_golden_border – Set golden_border_expires_at (null to disable) + sync has_gold_border on businesses
 *   set_spotlight   – Set spotlight_expires_at (null to disable) + sync search_priority_boost/is_featured
 *   set_promotions  – Set promotions_expires_at (null to disable)
 *   set_chat        – Set chat_expires_at (null to disable) + sync chat_enabled on businesses
 *
 * ─────────────────────────────────────────────
 * REQUIRED SUPABASE MIGRATION (run once in SQL Editor):
 *
 *   ALTER TABLE profiles
 *     ADD COLUMN IF NOT EXISTS golden_border_expires_at  timestamptz,
 *     ADD COLUMN IF NOT EXISTS spotlight_expires_at       timestamptz,
 *     ADD COLUMN IF NOT EXISTS promotions_expires_at      timestamptz,
 *     ADD COLUMN IF NOT EXISTS chat_expires_at            timestamptz;
 *
 * ─────────────────────────────────────────────
 * Security: requires checkAdminAuth() AND admin_master_ok cookie.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const VALID_TIERS = [0, 1, 2, 3] as const
type ValidTier = (typeof VALID_TIERS)[number]

type PerkAction =
  | "reset_plan"
  | "assign_plan"
  | "set_golden_border"
  | "set_spotlight"
  | "set_promotions"
  | "set_chat"

const TIER_LABELS: Record<number, string> = {
  0: "Básico",
  1: "Conecta",
  2: "Destaca",
  3: "Fundador",
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
    const { profileId, action, days, tier, disable } = body as {
      profileId?: string
      action?: PerkAction
      days?: unknown
      tier?: unknown
      disable?: boolean
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
    const businessUpdates: Record<string, unknown> = {}
    let successMessage = "Acción completada"

    // ── Build updates per action ──────────────────────────────────────────
    switch (action) {
      // ── 1. Reset plan only (individual perk expiry dates untouched) ───
      case "reset_plan": {
        profileUpdates.subscription_tier = 0
        profileUpdates.subscription_end_date = null
        // Reset base plan benefits on businesses; individual perks (golden border,
        // spotlight, chat) are left intact since they have their own expiry columns.
        businessUpdates.is_premium = false
        businessUpdates.premium_until = null
        successMessage = "Plan reseteado a Básico. Los beneficios individuales (borde, chat, etc.) no fueron afectados."
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

        // Sync complete benefits package per tier (mirrors tier-override logic)
        if (tierNum === 3) {
          businessUpdates.is_premium = true
          businessUpdates.premium_until = expiryDate
          businessUpdates.has_gold_border = true
          businessUpdates.search_priority_boost = true
          businessUpdates.is_featured = true
          businessUpdates.chat_enabled = true
        } else if (tierNum === 2) {
          businessUpdates.is_premium = true
          businessUpdates.premium_until = expiryDate
          businessUpdates.has_gold_border = false
          businessUpdates.search_priority_boost = true
          businessUpdates.is_featured = true
          businessUpdates.chat_enabled = true
        } else if (tierNum === 1) {
          businessUpdates.is_premium = true
          businessUpdates.premium_until = expiryDate
          businessUpdates.has_gold_border = false
          businessUpdates.search_priority_boost = false
          businessUpdates.is_featured = false
          businessUpdates.chat_enabled = true
        } else {
          businessUpdates.is_premium = false
          businessUpdates.premium_until = null
          businessUpdates.has_gold_border = false
          businessUpdates.search_priority_boost = false
          businessUpdates.is_featured = false
          businessUpdates.chat_enabled = false
        }

        successMessage = `Plan ${TIER_LABELS[tierNum]} asignado por ${daysNum} días.`
        break
      }

      // ── 3. Golden border perk (independent of tier) ───────────────────
      case "set_golden_border": {
        if (disable) {
          profileUpdates.golden_border_expires_at = null
          businessUpdates.has_gold_border = false
          successMessage = "Borde Dorado desactivado."
        } else {
          const daysNum = parseDays(days)
          if (!daysNum) {
            return NextResponse.json(
              { success: false, error: "days debe ser un número entero >= 1" },
              { status: 400 }
            )
          }
          profileUpdates.golden_border_expires_at = addDaysToNow(daysNum)
          businessUpdates.has_gold_border = true
          successMessage = `Borde Dorado activado por ${daysNum} días.`
        }
        break
      }

      // ── 4. Spotlight / search priority perk ───────────────────────────
      case "set_spotlight": {
        if (disable) {
          profileUpdates.spotlight_expires_at = null
          businessUpdates.search_priority_boost = false
          businessUpdates.is_featured = false
          successMessage = "Destacado desactivado."
        } else {
          const daysNum = parseDays(days)
          if (!daysNum) {
            return NextResponse.json(
              { success: false, error: "days debe ser un número entero >= 1" },
              { status: 400 }
            )
          }
          profileUpdates.spotlight_expires_at = addDaysToNow(daysNum)
          businessUpdates.search_priority_boost = true
          businessUpdates.is_featured = true
          successMessage = `Destacado activado por ${daysNum} días.`
        }
        break
      }

      // ── 5. Promotions perk ────────────────────────────────────────────
      case "set_promotions": {
        if (disable) {
          profileUpdates.promotions_expires_at = null
          successMessage = "Beneficio de Promociones desactivado."
        } else {
          const daysNum = parseDays(days)
          if (!daysNum) {
            return NextResponse.json(
              { success: false, error: "days debe ser un número entero >= 1" },
              { status: 400 }
            )
          }
          profileUpdates.promotions_expires_at = addDaysToNow(daysNum)
          successMessage = `Beneficio de Promociones activado por ${daysNum} días.`
        }
        break
      }

      // ── 6. Chat perk ──────────────────────────────────────────────────
      case "set_chat": {
        if (disable) {
          profileUpdates.chat_expires_at = null
          businessUpdates.chat_enabled = false
          successMessage = "Chat desactivado."
        } else {
          const daysNum = parseDays(days)
          if (!daysNum) {
            return NextResponse.json(
              { success: false, error: "days debe ser un número entero >= 1" },
              { status: 400 }
            )
          }
          profileUpdates.chat_expires_at = addDaysToNow(daysNum)
          businessUpdates.chat_enabled = true
          successMessage = `Chat activado por ${daysNum} días.`
        }
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
                "Columna no encontrada en profiles. Ejecuta la migración SQL indicada en el archivo de ruta primero.",
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

    // ── Sync boolean flags to all businesses of this profile ──────────────
    if (Object.keys(businessUpdates).length > 0) {
      const { error: bizErr } = await supabase
        .from("businesses")
        // @ts-ignore — some flags may not be in generated types
        .update(businessUpdates)
        .eq("owner_id", profileId)

      if (bizErr) {
        // Non-fatal: profile was already updated; log and continue
        console.error("[profile-perks] Error sincronizando negocios:", bizErr)
      }
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
