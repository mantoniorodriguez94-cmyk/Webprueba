// src/types/review.ts
// Type definitions for the reviews system

export type Review = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields from join
  user_name?: string;
  user_email?: string;
};

export type ReviewInsert = {
  business_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
};

export type ReviewUpdate = {
  rating?: number;
  comment?: string | null;
};

export type ReviewStats = {
  business_id: string;
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
};

export type ReviewFormData = {
  rating: number;
  comment: string;
};










