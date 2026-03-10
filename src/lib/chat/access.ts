/**
 * Unified chat access logic — single source of truth for the entire app.
 *
 * Chat is open to ALL registered users and businesses.
 * Any authenticated profile (non-null) has full access.
 */

export interface ChatAccessProfile {
  subscription_tier?: number | null
  chat_expires_at?: string | null
  chat_enabled?: boolean | null
}

/**
 * Returns true for any non-null profile.
 * Tier restrictions and modular-perk dates are intentionally not checked.
 */
export function hasChatAccess(
  profile: ChatAccessProfile | null | undefined
): boolean {
  return !!profile
}
