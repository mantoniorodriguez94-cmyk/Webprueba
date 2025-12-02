-- ============================================
-- SISTEMA DE SUSCRIPCIONES PREMIUM
-- ============================================
-- Migración completa para el sistema de pagos premium
-- Incluye: Planes, Suscripciones, Pagos, Verificaciones manuales

BEGIN;

-- ============================================
-- 1. TABLA: premium_plans (Catálogo de Planes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.premium_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC(10,2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  max_photos INTEGER DEFAULT 5,
  highlight_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.premium_plans IS 'Catálogo de planes premium disponibles';
COMMENT ON COLUMN public.premium_plans.billing_period IS 'monthly o yearly';
COMMENT ON COLUMN public.premium_plans.max_photos IS 'Número máximo de fotos en galería';
COMMENT ON COLUMN public.premium_plans.highlight_level IS 'Nivel de prioridad en destacados (mayor = mejor)';

-- ============================================
-- 2. TABLA: business_subscriptions (Suscripciones de Negocios)
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'expired', 'canceled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.business_subscriptions IS 'Suscripciones premium de cada negocio';
COMMENT ON COLUMN public.business_subscriptions.status IS 'active, pending, expired, canceled';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_business_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_subscriptions_updated_at ON public.business_subscriptions;
CREATE TRIGGER business_subscriptions_updated_at
  BEFORE UPDATE ON public.business_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_business_subscriptions_updated_at();

-- ============================================
-- 3. TABLA: payments (Registro General de Pagos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('paypal', 'manual')),
  amount_usd NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  external_id TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.payments IS 'Registro histórico de todos los pagos (PayPal y manuales)';
COMMENT ON COLUMN public.payments.method IS 'paypal o manual';
COMMENT ON COLUMN public.payments.status IS 'pending, completed, failed, refunded';
COMMENT ON COLUMN public.payments.external_id IS 'ID de transacción externa (PayPal order ID, etc)';
COMMENT ON COLUMN public.payments.raw_payload IS 'Respuesta completa de PayPal u otros datos';

-- ============================================
-- 4. TABLA: manual_payment_submissions (Pagos Manuales Pendientes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.manual_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  amount_usd NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('zelle', 'bank_transfer', 'other')),
  reference TEXT,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.manual_payment_submissions IS 'Envíos de pagos manuales pendientes de verificación';
COMMENT ON COLUMN public.manual_payment_submissions.payment_method IS 'zelle, bank_transfer, other';
COMMENT ON COLUMN public.manual_payment_submissions.status IS 'pending, approved, rejected';
COMMENT ON COLUMN public.manual_payment_submissions.screenshot_url IS 'URL del comprobante en Supabase Storage';

-- ============================================
-- 5. EXTENDER TABLA: businesses (Agregar Campos Premium)
-- ============================================

-- Verificar si las columnas ya existen antes de agregarlas
DO $$
BEGIN
  -- is_premium
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;

  -- premium_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'premium_until'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN premium_until TIMESTAMPTZ;
  END IF;

  -- premium_plan_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'premium_plan_id'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN premium_plan_id UUID REFERENCES public.premium_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.businesses.is_premium IS 'Indica si el negocio tiene suscripción premium activa';
COMMENT ON COLUMN public.businesses.premium_until IS 'Fecha de expiración de la suscripción premium';
COMMENT ON COLUMN public.businesses.premium_plan_id IS 'Plan premium actual del negocio';

-- ============================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business_status 
  ON public.business_subscriptions(business_id, status);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_user 
  ON public.business_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_end_date 
  ON public.business_subscriptions(end_date) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_payments_business_status 
  ON public.payments(business_id, status, method);

CREATE INDEX IF NOT EXISTS idx_payments_user 
  ON public.payments(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_payment_submissions_status 
  ON public.manual_payment_submissions(status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_businesses_premium 
  ON public.businesses(is_premium, premium_until) 
  WHERE is_premium = true;

-- ============================================
-- 7. RLS (ROW LEVEL SECURITY) POLÍTICAS
-- ============================================

-- Habilitar RLS en todas las tablas nuevas
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_submissions ENABLE ROW LEVEL SECURITY;

-- === PREMIUM_PLANS ===
-- Todos pueden leer los planes disponibles
DROP POLICY IF EXISTS "premium_plans_read_public" ON public.premium_plans;
CREATE POLICY "premium_plans_read_public" 
  ON public.premium_plans FOR SELECT 
  USING (is_active = true);

-- Solo service_role puede escribir (vía migraciones/admin)
DROP POLICY IF EXISTS "premium_plans_write_service" ON public.premium_plans;
CREATE POLICY "premium_plans_write_service" 
  ON public.premium_plans FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- === BUSINESS_SUBSCRIPTIONS ===
-- Los usuarios solo ven sus propias suscripciones
DROP POLICY IF EXISTS "business_subscriptions_read_own" ON public.business_subscriptions;
CREATE POLICY "business_subscriptions_read_own" 
  ON public.business_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear suscripciones
DROP POLICY IF EXISTS "business_subscriptions_insert_own" ON public.business_subscriptions;
CREATE POLICY "business_subscriptions_insert_own" 
  ON public.business_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Solo service_role puede actualizar (cuando se confirma el pago)
DROP POLICY IF EXISTS "business_subscriptions_update_service" ON public.business_subscriptions;
CREATE POLICY "business_subscriptions_update_service" 
  ON public.business_subscriptions FOR UPDATE 
  USING (auth.jwt()->>'role' = 'service_role');

-- === PAYMENTS ===
-- Los usuarios solo ven sus propios pagos
DROP POLICY IF EXISTS "payments_read_own" ON public.payments;
CREATE POLICY "payments_read_own" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear registros de pago
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" 
  ON public.payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Solo service_role puede actualizar pagos
DROP POLICY IF EXISTS "payments_update_service" ON public.payments;
CREATE POLICY "payments_update_service" 
  ON public.payments FOR UPDATE 
  USING (auth.jwt()->>'role' = 'service_role');

-- === MANUAL_PAYMENT_SUBMISSIONS ===
-- Los usuarios ven solo sus envíos
DROP POLICY IF EXISTS "manual_payments_read_own" ON public.manual_payment_submissions;
CREATE POLICY "manual_payments_read_own" 
  ON public.manual_payment_submissions FOR SELECT 
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear envíos
DROP POLICY IF EXISTS "manual_payments_insert_own" ON public.manual_payment_submissions;
CREATE POLICY "manual_payments_insert_own" 
  ON public.manual_payment_submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Solo service_role puede actualizar (aprobar/rechazar)
DROP POLICY IF EXISTS "manual_payments_update_service" ON public.manual_payment_submissions;
CREATE POLICY "manual_payments_update_service" 
  ON public.manual_payment_submissions FOR UPDATE 
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 8. INSERTAR PLANES PREMIUM DE EJEMPLO
-- ============================================

INSERT INTO public.premium_plans (name, description, price_usd, billing_period, max_photos, highlight_level, is_active)
VALUES 
  (
    'Premium Mensual',
    'Destaca tu negocio durante 1 mes completo. Aparece en la sección de destacados y obtén más visibilidad.',
    1.00,
    'monthly',
    10,
    1,
    true
  ),
  (
    'Premium Anual',
    'Destaca tu negocio durante 1 año completo con descuento especial. Máxima visibilidad y prioridad en búsquedas.',
    10.00,
    'yearly',
    20,
    2,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. FUNCIÓN AUXILIAR: Activar Premium
-- ============================================

CREATE OR REPLACE FUNCTION activate_business_premium(
  p_business_id UUID,
  p_plan_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_plan RECORD;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Obtener información del plan
  SELECT * INTO v_plan FROM public.premium_plans WHERE id = p_plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado';
  END IF;
  
  -- Calcular fecha de fin según billing_period
  IF v_plan.billing_period = 'monthly' THEN
    v_end_date := now() + INTERVAL '30 days';
  ELSIF v_plan.billing_period = 'yearly' THEN
    v_end_date := now() + INTERVAL '1 year';
  ELSE
    RAISE EXCEPTION 'Periodo de facturación inválido';
  END IF;
  
  -- Actualizar suscripción a activa
  UPDATE public.business_subscriptions
  SET 
    status = 'active',
    start_date = now(),
    end_date = v_end_date
  WHERE id = p_subscription_id;
  
  -- Activar premium en el negocio
  UPDATE public.businesses
  SET 
    is_premium = true,
    premium_until = v_end_date,
    premium_plan_id = p_plan_id
  WHERE id = p_business_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION activate_business_premium IS 'Activa el premium de un negocio después de confirmar pago';

-- ============================================
-- 10. FUNCIÓN AUXILIAR: Verificar Premiums Expirados
-- ============================================

CREATE OR REPLACE FUNCTION check_expired_premiums()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Desactivar negocios con premium expirado
  UPDATE public.businesses
  SET 
    is_premium = false,
    premium_plan_id = NULL
  WHERE is_premium = true 
    AND premium_until < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Marcar suscripciones como expiradas
  UPDATE public.business_subscriptions
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_date < now();
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_expired_premiums IS 'Verifica y desactiva premiums expirados (ejecutar periódicamente)';

COMMIT;

-- ============================================
-- RESUMEN DE TABLAS CREADAS
-- ============================================
-- ✅ premium_plans - Catálogo de planes
-- ✅ business_subscriptions - Suscripciones activas/historial
-- ✅ payments - Registro de todos los pagos
-- ✅ manual_payment_submissions - Pagos manuales pendientes
-- ✅ businesses - Extendida con is_premium, premium_until, premium_plan_id
-- ✅ Índices optimizados
-- ✅ RLS configurado
-- ✅ Funciones auxiliares
-- ✅ Planes de ejemplo insertados

