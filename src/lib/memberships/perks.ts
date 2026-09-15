/**
 * Beneficios sueltos — concesiones manuales con vencimiento.
 *
 * Un beneficio se tiene por dos vías independientes: porque lo da el plan, o
 * porque un admin lo concedió a mano por unos meses. La regla es siempre la
 * suma, nunca la resta:
 *
 *     tiene el beneficio = se lo da su plan  O  tiene concesión vigente
 *
 * Una concesión caducada no le quita nada a quien su plan ya se lo daba. Por
 * eso acá no hay un "revocar": basta con que pase la fecha.
 *
 * Las columnas viven en `businesses` y sólo las escribe el panel de admin
 * (un trigger en la base devuelve los valores anteriores si quien escribe no
 * es admin, porque la política RLS de UPDATE no restringe por columna y el
 * dueño podría regalarse el borde dorado desde la consola).
 *
 * Ver scripts/beneficios-sueltos.sql.
 */

import type { Business } from "@/types/business"
import {
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
  getMaxPhotosForTier,
  isTierActive,
} from "./tiers"

/**
 * Una bandera espejo del negocio —is_premium, is_featured— sigue vigente si
 * está encendida y su fecha no ha pasado.
 *
 * Existe porque esas columnas son un espejo que sólo se refresca cuando algo
 * las escribe: si nadie pasa a apagarlas, se quedan en `true` para siempre.
 * Hubo una ruta pensada para limpiarlas con un cron que nunca se llegó a
 * programar. En vez de montar esa maquinaria, se comprueba la fecha al leer,
 * que es lo que hace el resto de la app desde isTierActive: así da igual que
 * el espejo esté rancio.
 *
 * Sin fecha = sin vencimiento, la misma convención que isTierActive.
 */
export function banderaVigente(
  activa: boolean | null | undefined,
  hasta: string | null | undefined
): boolean {
  if (activa !== true) return false
  if (hasta == null || String(hasta).trim() === "") return true
  const fin = new Date(hasta)
  return !Number.isNaN(fin.getTime()) && fin > new Date()
}

/** Una fecha de concesión está vigente si existe y no ha pasado. */
export function perkVigente(hasta: string | null | undefined): boolean {
  if (hasta == null || String(hasta).trim() === "") return false
  const fin = new Date(hasta)
  return !Number.isNaN(fin.getTime()) && fin > new Date()
}

/** El marco y la corona dorada: plan Patrocina, o concesión vigente. */
export function tieneBordeDorado(
  business: Pick<Business, "perk_borde_dorado_hasta">,
  tierVigente: number
): boolean {
  return (
    tierVigente >= SUBSCRIPTION_TIER_PATROCINA ||
    perkVigente(business.perk_borde_dorado_hasta)
  )
}

/** El módulo de promociones: plan Patrocina, o concesión vigente. */
export function tienePromociones(
  business: Pick<Business, "perk_promociones_hasta">,
  tierVigente: number
): boolean {
  return (
    tierVigente >= SUBSCRIPTION_TIER_PATROCINA ||
    perkVigente(business.perk_promociones_hasta)
  )
}

/**
 * Prioridad en el orden del directorio: plan Destaca en adelante, la marca
 * `search_priority_boost` que sincroniza el plan, o concesión vigente.
 */
export function tienePrioridad(
  business: Pick<Business, "search_priority_boost" | "perk_prioridad_hasta">,
  tierVigente: number
): boolean {
  return (
    tierVigente >= SUBSCRIPTION_TIER_DESTACADO ||
    business.search_priority_boost === true ||
    perkVigente(business.perk_prioridad_hasta)
  )
}

/** Tope de fotos: el del plan más las extra concedidas, si están vigentes. */
export function topeDeFotos(
  business: Pick<Business, "perk_fotos_extra" | "perk_fotos_extra_hasta">,
  tierVigente: number
): number {
  const base = getMaxPhotosForTier(tierVigente)
  if (!perkVigente(business.perk_fotos_extra_hasta)) return base
  return base + Math.max(0, business.perk_fotos_extra ?? 0)
}

/** Chat en vivo: plan Conecta en adelante. Todavía no se concede suelto. */
export function tieneChat(tierVigente: number): boolean {
  return tierVigente >= SUBSCRIPTION_TIER_CONECTA
}

/** WhatsApp: plan Conecta en adelante. Es la conversación cómoda, sin marcar. */
export function tieneWhatsApp(tierVigente: number): boolean {
  return tierVigente >= SUBSCRIPTION_TIER_CONECTA
}

/**
 * El tier que de verdad cuenta para un dueño: el de la columna, pero sólo si
 * su suscripción sigue vigente. Un plan vencido vale exactamente lo mismo que
 * no tener plan.
 *
 * Existe porque cada sitio que necesitaba esto lo resolvía a su manera —uno
 * llamaba a isTierActive, otro usaba su resultado como si fuera el tier, y la
 * página pública se había reescrito la comparación de fechas a mano. Esa
 * última es la que preocupa: arreglar isTierActive no le llegaba.
 *
 * Sin fecha = vigencia indefinida, que es como el panel concede planes a mano.
 */
export function tierVigenteDelDueno(
  tier: number | null | undefined,
  finSuscripcion: string | null | undefined
): number {
  return isTierActive(tier, finSuscripcion) ? Number(tier) || 0 : 0
}

/** Por qué vías se puede contactar a un negocio. Ver `viasDeContacto`. */
export type ViasDeContacto = {
  /** Llamar. Siempre true; existe para que la regla se pueda leer y buscar. */
  telefono: boolean
  whatsapp: boolean
  /** Chat dentro de la app. Lo paga el negocio que RECIBE, no quien escribe. */
  chat: boolean
}

/**
 * La escalera de contacto, en un solo sitio.
 *
 * Estaba escrita tres veces —la tarjeta del feed, la ficha del dashboard y la
 * página pública— con tres expresiones distintas de la misma regla. Coincidían
 * por casualidad, porque las tres comparaban contra el mismo número; en cuanto
 * una cambiaba, las otras dos seguían con la regla vieja sin avisar. Así fue
 * como el chat quedó abierto para negocios sin plan: se arregló en la tarjeta
 * y no en las fichas.
 *
 * Devuelve las tres vías juntas a propósito. Pedirlas de una en una es lo que
 * permitía corregir el chat y olvidarse de WhatsApp en el mismo archivo.
 *
 * El teléfono lo ve TODO EL MUNDO, plan gratis incluido. Esto es un directorio:
 * un negocio está acá para que lo llamen, y esconder el teléfono esconde la
 * utilidad básica del producto. Antes el corte estaba en tier 2 y un negocio
 * gratis salía en la lista sin ninguna vía de contacto —un escaparate sin
 * puerta—; el cliente que abría tres fichas sin poder contactar ninguna
 * concluía que la app no sirve, y era justo el público que hace que los planes
 * valgan algo. Pesa doble en las fichas sembradas por el equipo: no tienen
 * dueño, o sea tier 0, y el argumento de venta es que ya reciben llamadas.
 */
export function viasDeContacto(
  tier: number | null | undefined,
  finSuscripcion: string | null | undefined
): ViasDeContacto {
  const vigente = tierVigenteDelDueno(tier, finSuscripcion)
  return {
    telefono: true,
    whatsapp: tieneWhatsApp(vigente),
    chat: tieneChat(vigente),
  }
}

/** Los beneficios que el panel sabe conceder, con su columna de vencimiento. */
export const PERKS_CONCEDIBLES = [
  { clave: "borde_dorado", etiqueta: "Borde dorado", columna: "perk_borde_dorado_hasta" },
  { clave: "promociones", etiqueta: "Módulo de promociones", columna: "perk_promociones_hasta" },
  { clave: "prioridad", etiqueta: "Prioridad en el directorio", columna: "perk_prioridad_hasta" },
  { clave: "fotos_extra", etiqueta: "Fotos extra", columna: "perk_fotos_extra_hasta" },
] as const

export type ClavePerk = (typeof PERKS_CONCEDIBLES)[number]["clave"]

/** Convierte una cantidad de meses en la fecha de vencimiento. 0 = quitar. */
export function vencimientoEnMeses(meses: number): string | null {
  if (!Number.isFinite(meses) || meses <= 0) return null
  const fin = new Date()
  fin.setMonth(fin.getMonth() + Math.floor(meses))
  return fin.toISOString()
}
