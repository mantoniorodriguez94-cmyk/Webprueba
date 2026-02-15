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

export type MembershipGateway = "paypal" | "crypto_trc20"

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

  // Obtener suscripción actual
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("subscription_tier, subscription_end_date")
    .eq("id", userId)
    .single()

  if (profileError) {
    throw profileError
  }

  const tierValue = (profile as any)?.subscription_tier ?? 0
  const currentTier: SubscriptionTier = tierValue as SubscriptionTier
  const endDateValue = (profile as any)?.subscription_end_date ?? null
  const currentEndRaw: string | null = endDateValue
  const nowMs = now.getTime()

  let newEndDate: Date
  let finalTier: SubscriptionTier = targetTier

  if (currentTier === targetTier && currentEndRaw) {
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

  const profileUpdate = {
    subscription_tier: finalTier,
    subscription_end_date: newEndDate.toISOString()
  }
  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update(profileUpdate as never)
    .eq("id", userId)

  if (updateError) {
    throw updateError
  }

  return { tier: finalTier, monthsAdded: monthsToAdd }
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


