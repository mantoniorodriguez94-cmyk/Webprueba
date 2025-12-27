// src/types/business.ts
// Type definition matching the exact Supabase 'businesses' table structure

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
  latitude: number | null; // Campo para coordenada GPS
  longitude: number | null; // Campo para coordenada GPS
  created_at?: string;
  updated_at?: string;
  // Premium fields
  is_premium?: boolean;
  premium_until?: string | null;
  premium_plan_id?: string | null;
  has_golden_border?: boolean;
  // Founder fields
  is_founder?: boolean; // Indica si el dueño actual es el fundador original
  // Admin fields
  is_featured?: boolean;
  featured_until?: string | null;
  max_photos?: number;
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  // Extended fields (from joins or calculations)
  total_reviews?: number;
  average_rating?: number;
  // Analytics fields
  views_count?: number;
  saved_count?: number;
  shared_count?: number;
};

export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>;
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;






