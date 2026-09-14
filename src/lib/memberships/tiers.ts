// src/lib/memberships/tiers.ts
// ---------------------------------------------
// Utilidades para niveles de SUSCRIPCIÓN (pre-pago mensual)
// y resolución de montos ↔ tier/meses.
//
// Este módulo NO realiza IO con la base de datos;
// solo contiene lógica pura de precios y tiers.

/**
 * Requisitos para entrar en la vitrina de "Mejores calificados".
 *
 * No es un ranking abierto sino un beneficio comprado: sólo aparecen Destaca y
 * Patrocina. Un negocio gratis con cinco estrellas no entra — si entrara, el
 * plan no vendería nada.
 *
 * El piso de reseñas es igual para todos y existe porque sin él una sola
 * reseña de cinco estrellas superaba a un negocio con cincuenta y un 4,9.
 *
 * Destaca exige la nota perfecta; Patrocina, que cuesta más, entra desde 4,5.
 * Es deliberado que el plan caro pida menos: parte de lo que compra es margen.
 */
export const MIN_RESENAS = 10
export const NOTA_MINIMA_DESTACA = 5
export const NOTA_MINIMA_PATROCINA = 4.5

// Cuántos negocios puede tener una cuenta. No depende del plan: los planes
// diferencian fotos, promociones y visibilidad, no cantidad de negocios.
// El candado real es el índice businesses_un_negocio_por_cuenta; esta
// constante sólo alimenta los avisos de la interfaz.
export const MAX_NEGOCIOS_POR_CUENTA = 1

// Constantes de tiers de suscripción
export const SUBSCRIPTION_TIER_FREE = 0 as const
export const SUBSCRIPTION_TIER_CONECTA = 1 as const
export const SUBSCRIPTION_TIER_DESTACADO = 2 as const
export const SUBSCRIPTION_TIER_PATROCINA = 3 as const
/** @deprecated use SUBSCRIPTION_TIER_PATROCINA */
export const SUBSCRIPTION_TIER_FUNDADOR = SUBSCRIPTION_TIER_PATROCINA

export type SubscriptionTier =
  | typeof SUBSCRIPTION_TIER_FREE
  | typeof SUBSCRIPTION_TIER_CONECTA
  | typeof SUBSCRIPTION_TIER_DESTACADO
  | typeof SUBSCRIPTION_TIER_PATROCINA

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
  [SUBSCRIPTION_TIER_DESTACADO]: 2,
  [SUBSCRIPTION_TIER_PATROCINA]: 3
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
    case SUBSCRIPTION_TIER_PATROCINA:
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
    case SUBSCRIPTION_TIER_PATROCINA:
      return "Patrocina"
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

/**
 * Fotos de galería por plan — fuente única de verdad.
 *
 * Antes el límite vivía suelto en la pantalla de galería como "3 gratis, 10
 * para cualquier plan pago", así que los tres planes daban lo mismo y la
 * tabla de precios describía una escalera (1 / 3 / 5) que el producto no
 * tenía. Peor: vendía 1 foto para Conecta cuando gratis ya daba 3, o sea que
 * pagar te daba menos.
 *
 * La escalera sube de tres en tres para que el salto entre planes sea legible
 * de un vistazo en la tabla de precios. Con las imágenes comprimidas al subir
 * (~250 KB en vez de ~3 MB), el coste de almacenamiento no es lo que manda
 * acá: el número existe para diferenciar planes, no para contener gastos.
 */
export const MAX_FOTOS_POR_TIER: Record<number, number> = {
  [SUBSCRIPTION_TIER_FREE]: 3,
  [SUBSCRIPTION_TIER_CONECTA]: 6,
  [SUBSCRIPTION_TIER_DESTACADO]: 9,
  [SUBSCRIPTION_TIER_PATROCINA]: 12,
}

export function getMaxPhotosForTier(tier: number | null | undefined): number {
  return MAX_FOTOS_POR_TIER[tier ?? 0] ?? MAX_FOTOS_POR_TIER[SUBSCRIPTION_TIER_FREE]
}

/**
 * Qué vende cada plan, en una sola lista.
 *
 * Vive acá y no escrito a mano en cada tabla de precios por dos motivos que
 * ya costaron caro. El primero: estaba duplicado en la tabla pública y en la
 * de dentro de la app, y ya habían divergido hasta en la ortografía. El
 * segundo, peor: las cifras iban a mano, así que la tabla anunciaba seis
 * fotos para el plan gratis cuando daba tres. Ahora las cifras salen de las
 * mismas constantes que aplica el producto, y no pueden mentir.
 *
 * Las frases son cortas a propósito: quien compara planes lee en diagonal.
 * Cada línea dice qué GANA la persona, no cómo está implementado. Y donde el
 * beneficio tiene condiciones —entrar en Mejores calificados exige nota y
 * reseñas— la condición va dicha, porque prometer lo que no se entrega es
 * exactamente lo que ya hubo que corregir una vez.
 */
export interface BeneficiosTier {
  /** Plan que este incluye entero, para no repetir la lista completa. */
  incluye?: string
  items: string[]
}

export const BENEFICIOS_POR_TIER: Record<number, BeneficiosTier> = {
  [SUBSCRIPTION_TIER_FREE]: {
    items: [
      "📍 Tu negocio en el directorio, con mapa y horario",
      "🔍 Apareces en las búsquedas",
      "📞 Tu teléfono visible para que te llamen",
      `📷 ${MAX_FOTOS_POR_TIER[SUBSCRIPTION_TIER_FREE]} fotos`,
    ],
  },
  [SUBSCRIPTION_TIER_CONECTA]: {
    incluye: "Básico",
    items: [
      "💬 Chat en vivo con tus clientes, escriba quien escriba",
      "📲 Botón directo a WhatsApp",
      `📷 ${MAX_FOTOS_POR_TIER[SUBSCRIPTION_TIER_CONECTA]} fotos`,
    ],
  },
  [SUBSCRIPTION_TIER_DESTACADO]: {
    incluye: "Conecta",
    items: [
      "🚀 Tu negocio sale primero en el directorio",
      `⭐ Entras en Mejores calificados con ${NOTA_MINIMA_DESTACA} estrellas y ${MIN_RESENAS} reseñas`,
      `📷 ${MAX_FOTOS_POR_TIER[SUBSCRIPTION_TIER_DESTACADO]} fotos`,
    ],
  },
  [SUBSCRIPTION_TIER_PATROCINA]: {
    incluye: "Destaca",
    items: [
      "✨ Tus promociones salen en la sección Promociones del inicio",
      "👑 Insignia de patrocinador y marco dorado en tu tarjeta",
      `⭐ Entras en Mejores calificados desde ${String(NOTA_MINIMA_PATROCINA).replace(".", ",")} estrellas`,
      `📷 ${MAX_FOTOS_POR_TIER[SUBSCRIPTION_TIER_PATROCINA]} fotos`,
    ],
  },
}

/**
 * Single source of truth for "is this subscription tier actually usable right now".
 * tier > 0 AND (no end date = admin-granted/indefinite, OR end date still in the future).
 * Used for both the current user (useMembershipAccess) and other profiles (e.g. a
 * business owner's tier, checked from a different user's session).
 */
export function isTierActive(
  tier: number | null | undefined,
  endDate: string | null | undefined
): boolean {
  const t = Number(tier) || 0
  if (t <= 0) return false
  if (endDate == null || String(endDate).trim() === "") return true
  const end = new Date(endDate)
  return !Number.isNaN(end.getTime()) && end > new Date()
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
    SUBSCRIPTION_TIER_PATROCINA
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

