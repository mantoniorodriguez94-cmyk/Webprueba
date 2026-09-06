// src/lib/memberships/service.ts
// ---------------------------------------------
// Servicio de membresías de usuario:
// - Registra pagos de membresía en membership_payments
// - Actualiza campos de membresía en public.profiles
//
// Este módulo está pensado para usarse SOLO en el backend
// (API routes / Server Actions), nunca en el cliente.

import { getAdminClient } from "@/lib/supabase/admin"
import type { SubscriptionTier } from "./tiers"
import { resolveSubscriptionFromAmount } from "./tiers"

export type MembershipGateway = "paypal" | "crypto_trc20" | "manual" | "binance_pay"

export interface ApplyMembershipFromPaymentInput {
  userId: string
  amount: number
  currency: "USD" | "USDT"
  gateway: MembershipGateway
  transactionRef: string
  /** Tier de suscripción objetivo (1, 2, 3) */
  targetTier?: SubscriptionTier
  /** Meses a agregar (por defecto 1) */
  monthsToAdd?: number
}

export interface ApplyMembershipResult {
  success: boolean
  error?: string
  tier?: SubscriptionTier
  monthsAdded?: number
}

/**
 * Inserta (o asegura) el registro en membership_payments.
 * - Si ya existe un registro completed con el mismo (gateway, transactionRef), se trata como idempotente.
 * - Si existe uno pending/failed, se actualiza a completed.
 */
async function upsertMembershipPayment(input: ApplyMembershipFromPaymentInput): Promise<void> {
  const adminSupabase = getAdminClient()

  // Buscar registro existente con mismo gateway + transaction_ref
  const { data: existing, error: fetchError } = await adminSupabase
    .from("membership_payments")
    .select("id, status")
    .eq("gateway", input.gateway)
    .eq("transaction_ref", input.transactionRef)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    // Código PGRST116 = no rows returned
    throw fetchError
  }

  if (!existing) {
    // Crear nuevo registro como completed
    // @ts-ignore - membership_payments not in generated schema
    const { error: insertError } = await adminSupabase.from("membership_payments").insert({
      user_id: input.userId,
      amount: input.amount,
      currency: input.currency,
      gateway: input.gateway,
      transaction_ref: input.transactionRef,
      status: "completed"
    } as any)

    if (insertError) {
      throw insertError
    }
    return
  }

  // Si ya existe y está completed, no hacemos nada (idempotente)
  if ((existing as any)?.status === "completed") {
    return
  }

  // Si existe pero está pending/failed, actualizar a completed
  // @ts-ignore - membership_payments not in generated schema
  const updateQuery = adminSupabase
    .from("membership_payments")
    .update({ status: "completed" } as never)
    .eq("id", (existing as any).id)
  const { error: updateError } = await updateQuery

  if (updateError) {
    throw updateError
  }
}

/**
 * Calcula y actualiza la suscripción de un usuario:
 * - Extiende la suscripción actual si sigue activa y es del mismo tier.
 * - O inicia/actualiza una nueva suscripción desde ahora para el tier objetivo.
 */
async function updateUserProfileSubscription(
  userId: string,
  targetTier: SubscriptionTier,
  monthsToAdd: number
): Promise<{ tier: SubscriptionTier; monthsAdded: number }> {
  const adminSupabase = getAdminClient()

  const daysToAdd = Math.max(1, monthsToAdd) * 30
  const now = new Date()

  // Obtener suscripción actual.
  // Use maybeSingle() so that a missing profiles row (PGRST116) does NOT throw —
  // new users whose trigger hasn't fired yet will get profile=null and be treated
  // as a fresh subscription (tier 0, no end date).
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("subscription_tier, subscription_end_date")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    // maybeSingle() only sets error for real DB/network failures, not for 0 rows
    throw profileError
  }

  // profile === null means no row exists yet → treat as brand-new subscription
  const tierValue = (profile as any)?.subscription_tier ?? 0
  const currentTier: SubscriptionTier = tierValue as SubscriptionTier
  const endDateValue = (profile as any)?.subscription_end_date ?? null
  const currentEndRaw: string | null = endDateValue
  const nowMs = now.getTime()

  let newEndDate: Date
  let finalTier: SubscriptionTier = targetTier

  // ── Highlander guard: never overwrite a permanent admin grant ──────────────
  // If subscription_end_date is NULL it means an admin set this tier as permanent
  // (no expiry). A payment renewal must NOT replace null with a future timestamp,
  // which could accidentally shorten an otherwise indefinite grant.
  // In that case we still extend forward from "now + daysToAdd" rather than from
  // null (which would be undefined arithmetic), so the user gets their purchased
  // time while converting the implicit permanent grant to an explicit timed one.
  const isCurrentlyPermanent = currentTier === targetTier && currentEndRaw === null

  if (isCurrentlyPermanent) {
    // Same tier, permanent admin grant → payment extends from now
    newEndDate = new Date(now)
    newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    finalTier = targetTier
  } else if (currentTier === targetTier && currentEndRaw) {
    const currentEnd = new Date(currentEndRaw)

    // Si la suscripción actual sigue activa, extender desde la fecha actual de expiración
    if (currentEnd.getTime() > nowMs) {
      newEndDate = new Date(currentEnd)
      newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    } else {
      // Expirada: empezar desde ahora
      newEndDate = new Date(now)
      newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    }
  } else {
    // Tier distinto (upgrade/downgrade) o sin suscripción previa:
    // iniciar suscripción desde ahora con el tier objetivo
    newEndDate = new Date(now)
    newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    finalTier = targetTier
  }

  // Use upsert so the write succeeds even if the profiles row doesn't exist yet.
  // onConflict:'id' → UPDATE matching columns when the row already exists,
  // INSERT a minimal row (id + subscription fields) when it doesn't.
  const { error: updateError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        subscription_tier: finalTier,
        subscription_end_date: newEndDate.toISOString(),
      } as never,
      { onConflict: "id" }
    )

  if (updateError) {
    throw updateError
  }

  return { tier: finalTier, monthsAdded: monthsToAdd }
}

export interface TierBenefitsOptions {
  /**
   * Fecha de expiración explícita a escribir en businesses.premium_until.
   * Si se omite, se EXTIENDE el premium_until actual de cada negocio
   * en `extendDays` días (comportamiento de compra/renovación).
   */
  untilISO?: string
  /** Días a sumar cuando no se pasa untilISO. Por defecto 30. */
  extendDays?: number
  /**
   * false (por defecto, semántica de PAGO): los beneficios solo se AGREGAN,
   * nunca se quitan — un pago jamás debe revocar un beneficio existente.
   * true (semántica de OVERRIDE de admin): los flags que el tier NO otorga se
   * limpian explícitamente, y se gestiona además `is_featured`.
   */
  authoritative?: boolean
}

/**
 * ÚNICA fuente de verdad para "qué flags visuales de negocio otorga un tier".
 *
 * Sincroniza los beneficios del tier de la CUENTA sobre TODOS los negocios del
 * usuario. Debe ser llamada por los tres caminos que otorgan tier:
 *   1) Compra automática por PayPal  (/api/memberships/paypal/capture-order)
 *   2) Aprobación de pago manual     (/api/admin/payments/approve)
 *   3) Asignación directa por admin  (/api/admin/profile-perks → assign_plan)
 *
 * Mantener esta lógica en UN solo lugar evita el drift entre caminos que ya
 * causó un bug real en este proyecto.
 *
 * Mapa de beneficios por tier:
 *   tier >= 1 (Conecta)   → is_premium + premium_until
 *   tier >= 2 (Destaca)   → search_priority_boost (+ is_featured si authoritative)
 *   tier >= 3 (Patrocina) → has_gold_border
 *
 * Nunca lanza: los beneficios visuales son secundarios frente al pago ya
 * aplicado en `profiles`, así que los errores solo se loguean.
 */
export async function applyTierBenefitsToBusinesses(
  userId: string,
  tier: number,
  options: TierBenefitsOptions = {}
): Promise<void> {
  const { untilISO, extendDays = 30, authoritative = false } = options

  try {
    if (!userId) return

    const adminSupabase = getAdminClient()
    const tierNum = Number(tier) || 0

    // Tier 0 sin modo authoritative: no hay nada que otorgar y un pago nunca
    // debe revocar beneficios existentes.
    if (tierNum <= 0 && !authoritative) return

    const { data: businesses, error: bizError } = await adminSupabase
      .from("businesses")
      .select("id, premium_until, owner_id")
      .eq("owner_id", userId)

    if (bizError) {
      console.error("[membership] applyTierBenefitsToBusinesses fetch error:", bizError)
      return
    }
    if (!businesses || businesses.length === 0) return

    const now = new Date()

    for (const biz of businesses as any[]) {
      const update: Record<string, unknown> = {}

      if (tierNum <= 0) {
        // Solo alcanzable en modo authoritative (admin bajando a Básico)
        update.is_premium = false
        update.premium_until = null
        update.has_gold_border = false
        update.search_priority_boost = false
        update.is_featured = false
      } else {
        let premiumUntil: string
        if (untilISO) {
          premiumUntil = untilISO
        } else {
          // Extender desde la fecha vigente si aún es futura; si no, desde hoy
          const current = biz.premium_until ? new Date(biz.premium_until) : now
          const base = current > now ? current : now
          const newDate = new Date(base)
          newDate.setDate(newDate.getDate() + extendDays)
          premiumUntil = newDate.toISOString()
        }

        update.is_premium = true
        update.premium_until = premiumUntil

        if (tierNum >= 2) {
          update.search_priority_boost = true
          if (authoritative) update.is_featured = true
        } else if (authoritative) {
          update.search_priority_boost = false
          update.is_featured = false
        }

        if (tierNum >= 3) {
          update.has_gold_border = true
        } else if (authoritative) {
          update.has_gold_border = false
        }
      }

      const { error: updateError } = await adminSupabase
        .from("businesses")
        // @ts-ignore - generated DB type may omit premium/boost columns
        .update(update)
        .eq("id", biz.id)

      if (updateError) {
        console.error(
          "[membership] applyTierBenefitsToBusinesses update error:",
          biz.id,
          updateError
        )
      }
    }
  } catch (err) {
    // No romper el flujo de pago: el tier de la cuenta ya fue aplicado.
    console.error("[membership] applyTierBenefitsToBusinesses error:", err)
  }
}

/**
 * Aplica una SUSCRIPCIÓN de usuario a partir de un pago verificado.
 *
 * - Registra el pago en membership_payments (idempotente).
 * - Calcula tier y meses en base al monto (o targetTier + monthsToAdd).
 * - Actualiza los campos de suscripción en public.profiles.
 */
export async function applyMembershipFromPayment(
  input: ApplyMembershipFromPaymentInput
): Promise<ApplyMembershipResult> {
  try {
    if (!input.userId) {
      return { success: false, error: "userId es requerido" }
    }

    if (!input.transactionRef) {
      return { success: false, error: "transactionRef es requerido" }
    }

    if (input.amount <= 0 || !Number.isFinite(input.amount)) {
      return { success: false, error: "amount inválido" }
    }

    // Resolver tier + meses:
    // - Si se pasó targetTier + monthsToAdd, usarlos directamente.
    // - Si no, intentar inferirlos desde el monto.
    let targetTier: SubscriptionTier | undefined = input.targetTier
    let monthsToAdd = input.monthsToAdd ?? 1

    if (!targetTier) {
      const resolved = resolveSubscriptionFromAmount(input.amount)
      if (!resolved) {
        return {
          success: false,
          error: "El monto no corresponde a ningún plan de suscripción válido"
        }
      }
      targetTier = resolved.tier
      monthsToAdd = resolved.months
    }

    if (monthsToAdd <= 0) {
      monthsToAdd = 1
    }

    // 1) Registrar / actualizar el pago en membership_payments
    await upsertMembershipPayment(input)

    // 2) Actualizar perfil del usuario con tier y expiración
    const subscriptionResult = await updateUserProfileSubscription(
      input.userId,
      targetTier,
      monthsToAdd
    )

    return {
      success: true,
      tier: subscriptionResult.tier,
      monthsAdded: subscriptionResult.monthsAdded
    }
  } catch (error: any) {
    console.error("[membership] applyMembershipFromPayment error:", error)
    return {
      success: false,
      error: error?.message || "Error interno aplicando membresía"
    }
  }
}


