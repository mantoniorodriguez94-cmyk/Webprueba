// src/types/business.ts
// Type definition matching the exact Supabase 'businesses' table structure

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  phone: number | null;
  whatsapp: number | null;
  logo_url: string | null;
  gallery_urls: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>;
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;

