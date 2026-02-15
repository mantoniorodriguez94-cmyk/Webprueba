// src/lib/memberships/tiers.ts
// ---------------------------------------------
// Utilidades para niveles de SUSCRIPCIÓN (pre-pago mensual)
// y resolución de montos ↔ tier/meses.
//
// Este módulo NO realiza IO con la base de datos;
// solo contiene lógica pura de precios y tiers.

// Constantes de tiers de suscripción
export const SUBSCRIPTION_TIER_FREE = 0 as const
export const SUBSCRIPTION_TIER_CONECTA = 1 as const
export const SUBSCRIPTION_TIER_DESTACADO = 2 as const
export const SUBSCRIPTION_TIER_FUNDADOR = 3 as const

export type SubscriptionTier =
  | typeof SUBSCRIPTION_TIER_FREE
  | typeof SUBSCRIPTION_TIER_CONECTA
  | typeof SUBSCRIPTION_TIER_DESTACADO
  | typeof SUBSCRIPTION_TIER_FUNDADOR

// Alias para compatibilidad con código existente
export type MembershipTier = SubscriptionTier

export type BadgeType =
  | "none"
  | "member"
  | "bronze_shield"
  | "silver_star"
  | "gold_crown"

export interface ResolvedMembershipTier {
  tier: MembershipTier
  badgeType: BadgeType
  label: string
  /** Precio mensual base asociado al tier, en USD */
  baseAmount: number
}

// Precios MENSUALES de suscripción en USD
export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  [SUBSCRIPTION_TIER_FREE]: 0,
  [SUBSCRIPTION_TIER_CONECTA]: 1,
  [SUBSCRIPTION_TIER_DESTACADO]: 3,
  [SUBSCRIPTION_TIER_FUNDADOR]: 5
}

// Tolerancia para montos flotantes (por fees/conversiones menores)
export const AMOUNT_TOLERANCE = 0.11 // 11 centavos

export function isApproximately(
  value: number,
  target: number,
  tolerance: number = AMOUNT_TOLERANCE
): boolean {
  return Math.abs(value - target) <= tolerance
}

export function getBadgeTypeForTier(tier: MembershipTier): BadgeType {
  switch (tier) {
    case SUBSCRIPTION_TIER_CONECTA:
      return "member"
    case SUBSCRIPTION_TIER_DESTACADO:
      return "bronze_shield"
    case SUBSCRIPTION_TIER_FUNDADOR:
      return "gold_crown"
    default:
      return "none"
  }
}

export function getLabelForTier(tier: SubscriptionTier): string {
  switch (tier) {
    case SUBSCRIPTION_TIER_CONECTA:
      return "Conecta"
    case SUBSCRIPTION_TIER_DESTACADO:
      return "Destaca"
    case SUBSCRIPTION_TIER_FUNDADOR:
      return "Fundador"
    default:
      return "Básico"
  }
}

export function getPriceForTier(tier: SubscriptionTier): number {
  return SUBSCRIPTION_PRICES[tier] ?? 0
}

export function getPlanByTier(
  tier: number
): { tier: SubscriptionTier; name: string; priceMonthly: number } | null {
  const t = tier as SubscriptionTier
  const priceMonthly = getPriceForTier(t)
  if (!Number.isFinite(priceMonthly) || priceMonthly < 0) {
    return null
  }
  return {
    tier: t,
    name: getLabelForTier(t),
    priceMonthly
  }
}

/** Máximo de negocios por cuenta: tier 0–2 → 1, tier 3 (Fundador) → 2 */
export function getMaxBusinessesForTier(tier: number | null | undefined): number {
  if (tier == null || !Number.isFinite(tier)) return 1
  return tier === SUBSCRIPTION_TIER_FUNDADOR ? 2 : 1
}

/**
 * Calcula el total a pagar para una suscripción dada.
 * 
 * Regla de descuento:
 *  - Si months === 12 → se cobra solo 10 meses (paga 10, recibe 12).
 */
export function calculateSubscriptionTotal(tier: number, months: number): number {
  const pricePerMonth = getPriceForTier(tier as SubscriptionTier)
  if (!Number.isFinite(pricePerMonth) || pricePerMonth <= 0 || months <= 0) {
    return 0
  }

  const effectiveMonths = months === 12 ? 10 : months
  return Number((pricePerMonth * effectiveMonths).toFixed(2))
}

/**
 * Resolver tier + meses a partir de un monto total en USD.
 * 
 * Intenta encontrar una combinación (tier, meses) tal que:
 *   monto ≈ SUBSCRIPTION_PRICES[tier] * meses
 */
export function resolveSubscriptionFromAmount(
  amountRaw: number
): { tier: SubscriptionTier; months: number } | null {
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return null
  }

  const amount = Number(amountRaw.toFixed(2))

  const candidateTiers: SubscriptionTier[] = [
    SUBSCRIPTION_TIER_CONECTA,
    SUBSCRIPTION_TIER_DESTACADO,
    SUBSCRIPTION_TIER_FUNDADOR
  ]

  for (const tier of candidateTiers) {
    const price = getPriceForTier(tier)
    if (price <= 0) continue

    const rawMonths = amount / price
    const rounded = Math.round(rawMonths)

    if (rounded >= 1 && isApproximately(amount, price * rounded)) {
      return { tier, months: rounded }
    }
  }

  return null
}

/**
 * Alias de compatibilidad: resuelve un ResolvedMembershipTier desde un monto total.
 * No incluye meses; solo el tier asociado al monto.
 */
export function resolveMembershipTier(amountRaw: number): ResolvedMembershipTier | null {
  const resolved = resolveSubscriptionFromAmount(amountRaw)
  if (!resolved) return null

  const { tier } = resolved
  const baseAmount = getPriceForTier(tier)

  return {
    tier,
    badgeType: getBadgeTypeForTier(tier),
    label: getLabelForTier(tier),
    baseAmount
  }
}

