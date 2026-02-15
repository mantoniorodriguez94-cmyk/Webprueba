-- ============================================
-- SISTEMA DE MEMBRESÍAS DE USUARIO (PERFILES)
-- ============================================
-- Este script agrega soporte para:
-- 1) Campos de membresía en public.profiles
-- 2) Tabla membership_payments como log/auditoría de pagos de membresía
--
-- ❗ IMPORTANTE:
-- - No modifica la tabla existente public.payments (usada para negocios premium)
-- - No cambia ningún flujo de negocios premium ya implementado
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. EXTENDER TABLA public.profiles
-- ============================================
-- Campos agregados:
-- - membership_tier (0 = free, 1..4 = niveles de membresía)
-- - badge_type ('none','member','bronze_shield','silver_star','gold_crown')
-- - membership_expiry (timestamp opcional para futuras renovaciones)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_tier INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_type TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.membership_tier IS
  'Nivel de membresía de usuario: 0=Free, 1=Member, 2=Bronze, 3=Silver, 4=Gold';

COMMENT ON COLUMN public.profiles.badge_type IS
  'Badge visual asociado a la membresía: none, member, bronze_shield, silver_star, gold_crown';

COMMENT ON COLUMN public.profiles.membership_expiry IS
  'Fecha de expiración de la membresía (NULL = vitalicia / no usada aún)';

-- Asegurar constraint para badge_type (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'profiles_badge_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_badge_type_check
      CHECK (badge_type IN ('none','member','bronze_shield','silver_star','gold_crown'));
  END IF;
END $$;

-- Opcional: constraint simple para rango de membership_tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'profiles_membership_tier_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_membership_tier_check
      CHECK (membership_tier BETWEEN 0 AND 4);
  END IF;
END $$;

-- Índices de apoyo
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier
  ON public.profiles (membership_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_membership_expiry
  ON public.profiles (membership_expiry)
  WHERE membership_tier > 0;

-- ============================================
-- 2. TABLA: public.membership_payments
-- ============================================
-- Log/auditoría de pagos de membresía de usuario
--
-- NOTA:
-- - No interfiere con public.payments (que es para negocios premium)
-- - Se asocia directamente a auth.users (user_id)

CREATE TABLE IF NOT EXISTS public.membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD','USDT')),
  gateway TEXT NOT NULL CHECK (gateway IN ('paypal','crypto_trc20')),
  transaction_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.membership_payments IS
  'Registro histórico de pagos de membresía de usuario (PayPal y USDT TRC-20)';

COMMENT ON COLUMN public.membership_payments.user_id IS
  'Usuario de auth.users que realizó el pago de membresía';

COMMENT ON COLUMN public.membership_payments.amount IS
  'Monto de la transacción (en la moneda indicada)';

COMMENT ON COLUMN public.membership_payments.currency IS
  'Moneda del pago: USD (PayPal) o USDT (TRC-20)';

COMMENT ON COLUMN public.membership_payments.gateway IS
  'Gateway usado: paypal o crypto_trc20 (USDT en red Tron)';

COMMENT ON COLUMN public.membership_payments.transaction_ref IS
  'Identificador único de la transacción externa (PayPal orderId o hash TXID de Tron)';

COMMENT ON COLUMN public.membership_payments.status IS
  'Estado del pago: pending, completed, failed';

-- Evitar ataques de replay: un transaction_ref solo puede usarse una vez por gateway
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'membership_payments_gateway_transaction_ref_key'
  ) THEN
    ALTER TABLE public.membership_payments
      ADD CONSTRAINT membership_payments_gateway_transaction_ref_key
      UNIQUE (gateway, transaction_ref);
  END IF;
END $$;

-- Índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_membership_payments_user
  ON public.membership_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_membership_payments_status
  ON public.membership_payments(status);

CREATE INDEX IF NOT EXISTS idx_membership_payments_created_at
  ON public.membership_payments(created_at DESC);

-- ============================================
-- 3. RLS PARA membership_payments
-- ============================================

ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen (idempotente)
DROP POLICY IF EXISTS "membership_payments_read_own" ON public.membership_payments;
DROP POLICY IF EXISTS "membership_payments_insert_own" ON public.membership_payments;
DROP POLICY IF EXISTS "membership_payments_update_service" ON public.membership_payments;

-- Usuarios autenticados pueden ver SOLO sus pagos de membresía
CREATE POLICY "membership_payments_read_own"
  ON public.membership_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios autenticados pueden crear registros de pago SOLO para sí mismos
CREATE POLICY "membership_payments_insert_own"
  ON public.membership_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el service_role (API backend) puede actualizar registros
-- (por ejemplo, cambiar status de pending → completed)
CREATE POLICY "membership_payments_update_service"
  ON public.membership_payments
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

COMMIT;


