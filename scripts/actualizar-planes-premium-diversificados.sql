-- ============================================
-- ACTUALIZAR PLANES PREMIUM - DIVERSIFICADOS
-- ============================================
-- Este script actualiza los planes premium con nuevos precios y duraciones:
-- - Mensual: $2 USD (30 días)
-- - Trimestral: $4 USD (90 días) 
-- - Semestral: $6 USD (180 días)
-- - Anual: $10 USD (365 días)

-- ============================================
-- PASO 1: Actualizar el constraint de billing_period
-- ============================================

-- Primero eliminamos el constraint existente y lo recreamos con los nuevos valores
ALTER TABLE public.premium_plans 
  DROP CONSTRAINT IF EXISTS premium_plans_billing_period_check;

ALTER TABLE public.premium_plans 
  ADD CONSTRAINT premium_plans_billing_period_check 
  CHECK (billing_period IN ('monthly', 'quarterly', 'semiannual', 'yearly'));

-- ============================================
-- PASO 2: Desactivar planes existentes (opcional, para mantener historial)
-- ============================================

-- Desactivamos los planes anteriores en lugar de eliminarlos
UPDATE public.premium_plans SET is_active = false;

-- ============================================
-- PASO 3: Insertar los nuevos planes diversificados
-- ============================================

-- Plan Mensual - $2 USD
INSERT INTO public.premium_plans (name, description, price_usd, billing_period, max_photos, highlight_level, is_active)
VALUES (
  'Premium Mensual',
  'Destaca tu negocio durante 1 mes. Aparece en la sección de destacados.',
  2.00,
  'monthly',
  10,
  1,
  true
);

-- Plan Trimestral - $4 USD (cada 3 meses)
INSERT INTO public.premium_plans (name, description, price_usd, billing_period, max_photos, highlight_level, is_active)
VALUES (
  'Premium Trimestral',
  'Destaca tu negocio durante 3 meses. ¡Ahorra $2 USD vs el plan mensual!',
  4.00,
  'quarterly',
  12,
  2,
  true
);

-- Plan Semestral - $6 USD (cada 6 meses)
INSERT INTO public.premium_plans (name, description, price_usd, billing_period, max_photos, highlight_level, is_active)
VALUES (
  'Premium Semestral',
  'Destaca tu negocio durante 6 meses. ¡Ahorra $6 USD vs el plan mensual!',
  6.00,
  'semiannual',
  15,
  3,
  true
);

-- Plan Anual - $10 USD
INSERT INTO public.premium_plans (name, description, price_usd, billing_period, max_photos, highlight_level, is_active)
VALUES (
  'Premium Anual',
  'Destaca tu negocio durante 1 año completo. ¡El mejor valor! Ahorra $14 USD.',
  10.00,
  'yearly',
  20,
  4,
  true
);

-- ============================================
-- PASO 4: Verificar los planes creados
-- ============================================

SELECT 
  name,
  price_usd,
  billing_period,
  max_photos,
  highlight_level,
  is_active,
  CASE billing_period
    WHEN 'monthly' THEN '30 días'
    WHEN 'quarterly' THEN '90 días (3 meses)'
    WHEN 'semiannual' THEN '180 días (6 meses)'
    WHEN 'yearly' THEN '365 días (1 año)'
  END as duracion
FROM public.premium_plans
WHERE is_active = true
ORDER BY price_usd;

-- ============================================
-- PASO 5: Actualizar la función de activación premium
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
  ELSIF v_plan.billing_period = 'quarterly' THEN
    v_end_date := now() + INTERVAL '90 days';
  ELSIF v_plan.billing_period = 'semiannual' THEN
    v_end_date := now() + INTERVAL '180 days';
  ELSIF v_plan.billing_period = 'yearly' THEN
    v_end_date := now() + INTERVAL '365 days';
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

-- ============================================
-- PASO 6: Actualizar política RLS para permitir leer todos los planes
-- ============================================
-- Esto permite que las suscripciones existentes puedan cargar sus planes
-- aunque estén inactivos (para mostrar el nombre del plan actual)

DROP POLICY IF EXISTS "premium_plans_read_public" ON public.premium_plans;
CREATE POLICY "premium_plans_read_public" 
  ON public.premium_plans FOR SELECT 
  USING (true);  -- Permitir leer todos los planes

-- ============================================
-- PASO 8: Migrar suscripciones existentes a los nuevos planes
-- ============================================

-- Actualizar suscripciones que tenían plan mensual antiguo al nuevo mensual
UPDATE business_subscriptions bs
SET plan_id = (SELECT id FROM premium_plans WHERE billing_period = 'monthly' AND is_active = true LIMIT 1)
WHERE bs.plan_id IN (SELECT id FROM premium_plans WHERE billing_period = 'monthly' AND is_active = false);

-- Actualizar suscripciones que tenían plan anual antiguo al nuevo anual
UPDATE business_subscriptions bs
SET plan_id = (SELECT id FROM premium_plans WHERE billing_period = 'yearly' AND is_active = true LIMIT 1)
WHERE bs.plan_id IN (SELECT id FROM premium_plans WHERE billing_period = 'yearly' AND is_active = false);

-- Actualizar businesses con premium_plan_id a los nuevos planes
UPDATE businesses b
SET premium_plan_id = (SELECT id FROM premium_plans WHERE billing_period = 'monthly' AND is_active = true LIMIT 1)
WHERE b.premium_plan_id IN (SELECT id FROM premium_plans WHERE billing_period = 'monthly' AND is_active = false);

UPDATE businesses b
SET premium_plan_id = (SELECT id FROM premium_plans WHERE billing_period = 'yearly' AND is_active = true LIMIT 1)
WHERE b.premium_plan_id IN (SELECT id FROM premium_plans WHERE billing_period = 'yearly' AND is_active = false);

-- ============================================
-- PASO 9: Verificar que no hay referencias a planes inactivos
-- ============================================

SELECT 
  'Suscripciones con plan inactivo' as tipo,
  COUNT(*) as cantidad
FROM business_subscriptions bs
JOIN premium_plans pp ON bs.plan_id = pp.id
WHERE pp.is_active = false AND bs.status = 'active'
UNION ALL
SELECT 
  'Negocios con plan inactivo' as tipo,
  COUNT(*) as cantidad
FROM businesses b
JOIN premium_plans pp ON b.premium_plan_id = pp.id
WHERE pp.is_active = false AND b.is_premium = true;

-- ============================================
-- RESUMEN DE CAMBIOS
-- ============================================
-- ✅ Constraint actualizado para nuevos períodos
-- ✅ Planes anteriores desactivados
-- ✅ 4 nuevos planes creados:
--    - Mensual: $2 USD (30 días)
--    - Trimestral: $4 USD (90 días)
--    - Semestral: $6 USD (180 días)
--    - Anual: $10 USD (365 días)
-- ✅ Función activate_business_premium actualizada
-- ✅ Suscripciones existentes migradas a nuevos planes


