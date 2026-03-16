/**
 * Chat access — abierto a todos los usuarios registrados.
 *
 * Regla: cualquier perfil autenticado (no nulo) tiene acceso al chat.
 * No se requiere plan de suscripción ni perk modular.
 */

export interface ChatAccessProfile {
  subscription_tier?: number | null
  chat_expires_at?: string | null
  chat_enabled?: boolean | null
}

export function hasChatAccess(
  profile: ChatAccessProfile | Record<string, unknown> | null | undefined
): boolean {
  // Si existe un perfil (usuario autenticado) → acceso permitido
  return !!profile
}
