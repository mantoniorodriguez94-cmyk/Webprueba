-- ============================================
-- MIGRACIÓN A MODELO DE SUSCRIPCIONES PREPAGADAS
-- ============================================
-- Objetivo:
-- 1) Introducir subscription_tier y subscription_end_date en public.profiles
--    mapeando el concepto previo de membership_tier.
-- 2) Crear tabla business_promotions para beneficios de Tier 3 ("Fundador").
--
-- NOTA:
-- - No se eliminan columnas existentes (membership_tier, badge_type, etc.)
-- - Se busca compatibilidad y capacidad de rollback sencilla.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. EXTENDER public.profiles CON CAMPOS DE SUSCRIPCIÓN
-- ============================================

-- Agregar columnas si no existen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.subscription_tier IS
  'Nivel de suscripción prepagada: 0=Free, 1=Conecta, 2=Destacado, 3=Fundador';

COMMENT ON COLUMN public.profiles.subscription_end_date IS
  'Fecha de expiración de la suscripción actual (NULL = sin suscripción activa)';

-- Constraint de rango para subscription_tier (0..3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_tier_check
      CHECK (subscription_tier BETWEEN 0 AND 3);
  END IF;
END $$;

-- Índices de apoyo
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON public.profiles (subscription_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date
  ON public.profiles (subscription_end_date)
  WHERE subscription_tier > 0;

-- Inicializar subscription_tier desde membership_tier (si existe la columna)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name = 'profiles'
    AND    column_name = 'membership_tier'
  ) THEN
    UPDATE public.profiles
    SET subscription_tier = GREATEST(0, LEAST(3, membership_tier))
    WHERE subscription_tier = 0;
  END IF;
END $$;

-- ============================================
-- 2. TABLA business_promotions (Beneficio Tier 3)
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.business_promotions IS
  'Promociones destacadas creadas por usuarios con suscripción Tier 3 (Fundador)';

COMMENT ON COLUMN public.business_promotions.user_id IS
  'Usuario (auth.users.id) propietario de la promoción';

COMMENT ON COLUMN public.business_promotions.active IS
  'Indica si la promoción está activa y visible públicamente';

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_promotions_user
  ON public.business_promotions (user_id);

CREATE INDEX IF NOT EXISTS idx_business_promotions_active
  ON public.business_promotions (active)
  WHERE active = true;

-- ============================================
-- 3. RLS PARA business_promotions
-- ============================================

ALTER TABLE public.business_promotions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas (idempotente)
DROP POLICY IF EXISTS "business_promotions_insert_tier3" ON public.business_promotions;
DROP POLICY IF EXISTS "business_promotions_update_tier3" ON public.business_promotions;
DROP POLICY IF EXISTS "business_promotions_select_active" ON public.business_promotions;

-- Solo usuarios Tier 3 pueden CREAR promociones
CREATE POLICY "business_promotions_insert_tier3"
  ON public.business_promotions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.subscription_tier = 3
    )
  );

-- Solo usuarios Tier 3 pueden MODIFICAR sus propias promociones
CREATE POLICY "business_promotions_update_tier3"
  ON public.business_promotions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.subscription_tier = 3
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.subscription_tier = 3
    )
  );

-- Todos pueden ver promociones ACTIVAS
CREATE POLICY "business_promotions_select_active"
  ON public.business_promotions
  FOR SELECT
  USING (active = true);

COMMIT;


