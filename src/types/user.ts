// src/types/user.ts
// Extended user types with metadata

export type UserRole = "person" | "company";

export interface UserMetadata {
  full_name?: string;
  role?: UserRole;
  allowed_businesses?: number;
  avatar_url?: string;
  location?: string;
  is_admin?: boolean;
  is_premium?: boolean; // Campo para plan premium
}

export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  created_at?: string;
}

export interface FilterOptions {
  category?: string;
  location?: string;
  searchTerm?: string;
}



