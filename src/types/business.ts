// src/types/business.ts
// Type definition matching the exact Supabase 'businesses' table structure

/**
 * Profile fields joined from the owner's row in the `profiles` table.
 * These are the ONLY authoritative source for subscription status.
 * Never read tier or perk data from the `businesses` row itself.
 */
export type OwnerProfileJoin = {
  subscription_tier: number | null
  /** Modular admin perk: golden border active until this ISO date */
  golden_border_expires_at?: string | null
  /** Modular admin perk: chat active until this ISO date */
  chat_expires_at?: string | null
  /** Modular admin perk: spotlight/featured active until this ISO date */
  spotlight_expires_at?: string | null
}

export type Business = {
  id: string;
  owner_id: string | null; // Puede ser null para negocios huérfanos
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  address_details: string | null;
  state_id: number | null;
  municipality_id: number | null;
  phone: number | null;
  whatsapp: number | null;
  logo_url: string | null;
  gallery_urls: string[] | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
  updated_at?: string;
  // ── Business-level flags (admin-synced mirrors, can lag profiles) ──────────
  is_premium?: boolean;
  premium_until?: string | null;
  premium_plan_id?: string | null;
  /** DB column: has_gold_border (not has_golden_border) */
  has_gold_border?: boolean;
  is_founder?: boolean;
  is_featured?: boolean;
  featured_until?: string | null;
  max_photos?: number;
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  extra_photo_limit?: number;
  search_priority_boost?: boolean;
  infraction_status?: boolean;
  infraction_reason?: string | null;
  /** Admin-toggled chat flag synced from profile perk */
  chat_enabled?: boolean | null;
  // ── Extended / calculated fields ──────────────────────────────────────────
  total_reviews?: number;
  average_rating?: number;
  views_count?: number;
  saved_count?: number;
  shared_count?: number;
  /**
   * Owner profile data joined at fetch time.
   * This is the SINGLE SOURCE OF TRUTH for tier, golden border, chat, spotlight.
   * Always prefer these fields over the stale boolean mirrors above.
   */
  profiles?: OwnerProfileJoin | null;
  /**
   * Alias for `profiles` — some queries join via profiles!owner_id.
   * Contains subscription_tier only; full perk data lives in `profiles`.
   */
  owner?: Pick<OwnerProfileJoin, 'subscription_tier'> | null;
};

export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>;
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;
