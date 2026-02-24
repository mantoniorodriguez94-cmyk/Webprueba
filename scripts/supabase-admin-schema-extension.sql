-- Portal Encuentra LLC - Admin schema extension
-- Run this in Supabase SQL Editor to add columns for admin overrides and notifications.

-- PROFILES: extra limits and direct notification
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS extra_business_limit int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_message text,
  ADD COLUMN IF NOT EXISTS show_admin_modal boolean DEFAULT false;

COMMENT ON COLUMN profiles.extra_business_limit IS 'Extra businesses allowed on top of tier limit';
COMMENT ON COLUMN profiles.admin_message IS 'Message from admin shown in modal when show_admin_modal is true';
COMMENT ON COLUMN profiles.show_admin_modal IS 'When true, user sees admin_message in a modal until dismissed';

-- BUSINESSES: photo limit, search boost, infraction
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS extra_photo_limit int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_priority_boost boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infraction_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infraction_reason text;

COMMENT ON COLUMN businesses.extra_photo_limit IS 'Extra photos allowed on top of max_photos';
COMMENT ON COLUMN businesses.search_priority_boost IS 'When true, business appears at top of search/feed';
COMMENT ON COLUMN businesses.infraction_status IS 'When true, owner sees infraction banner';
COMMENT ON COLUMN businesses.infraction_reason IS 'Reason shown to owner when infraction_status is true';
