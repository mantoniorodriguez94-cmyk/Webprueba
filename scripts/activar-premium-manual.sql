-- ============================================
-- ACTIVAR PREMIUM MANUALMENTE
-- ============================================
-- Si realizaste un pago pero tu negocio no recibió los beneficios,
-- usa este script para activar el premium manualmente

-- PASO 1: Identificar tu pago más reciente
-- Ejecuta esto primero para obtener la información:

SELECT 
  p.id as payment_id,
  p.business_id,
  p.plan_id,
  p.status as payment_status,
  p.created_at as payment_date,
  pp.name as plan_name,
  pp.billing_period,
  pp.price_usd,
  b.name as business_name,
  b.is_premium as current_premium_status,
  b.premium_until
FROM payments p
JOIN premium_plans pp ON p.plan_id = pp.id
JOIN businesses b ON p.business_id = b.id
WHERE p.user_id = auth.uid()  -- Tu usuario actual
ORDER BY p.created_at DESC
LIMIT 5;

-- Si ves que payment_status = 'completed' pero current_premium_status = false,
-- continúa con el PASO 2

-- ============================================
-- PASO 2: ACTIVAR PREMIUM MANUALMENTE
-- ============================================

-- OPCIÓN A: Si conoces el ID del negocio y plan
-- REEMPLAZA estos valores:

DO $$
DECLARE
  v_business_id UUID := 'TU-NEGOCIO-ID-AQUI';  -- ← CAMBIAR
  v_plan_id UUID := 'TU-PLAN-ID-AQUI';          -- ← CAMBIAR
  v_billing_period TEXT;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Obtener el billing_period del plan
  SELECT billing_period INTO v_billing_period
  FROM premium_plans
  WHERE id = v_plan_id;
  
  -- Calcular fecha de expiración
  IF v_billing_period = 'monthly' THEN
    v_end_date := NOW() + INTERVAL '30 days';
  ELSIF v_billing_period = 'yearly' THEN
    v_end_date := NOW() + INTERVAL '1 year';
  ELSE
    v_end_date := NOW() + INTERVAL '30 days';
  END IF;
  
  -- Actualizar el negocio a premium
  UPDATE businesses
  SET 
    is_premium = true,
    premium_until = v_end_date,
    premium_plan_id = v_plan_id
  WHERE id = v_business_id;
  
  -- Crear o actualizar la suscripción
  INSERT INTO business_subscriptions (
    business_id,
    user_id,
    plan_id,
    status,
    start_date,
    end_date
  )
  VALUES (
    v_business_id,
    auth.uid(),
    v_plan_id,
    'active',
    NOW(),
    v_end_date
  )
  ON CONFLICT (business_id, user_id, plan_id) DO UPDATE
  SET 
    status = 'active',
    start_date = NOW(),
    end_date = EXCLUDED.end_date;
  
  RAISE NOTICE '✅ Premium activado hasta: %', v_end_date;
END $$;

-- ============================================
-- OPCIÓN B: Activar usando el último pago completado
-- ============================================

-- Este script encuentra automáticamente tu último pago completado
-- y activa el premium correspondiente

DO $$
DECLARE
  v_payment RECORD;
  v_plan RECORD;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Obtener el último pago completado del usuario
  SELECT * INTO v_payment
  FROM payments
  WHERE user_id = auth.uid()
    AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún pago completado';
  END IF;
  
  -- Obtener información del plan
  SELECT * INTO v_plan
  FROM premium_plans
  WHERE id = v_payment.plan_id;
  
  -- Calcular fecha de expiración
  IF v_plan.billing_period = 'monthly' THEN
    v_end_date := NOW() + INTERVAL '30 days';
  ELSIF v_plan.billing_period = 'yearly' THEN
    v_end_date := NOW() + INTERVAL '1 year';
  ELSE
    v_end_date := NOW() + INTERVAL '30 days';
  END IF;
  
  -- Actualizar el negocio a premium
  UPDATE businesses
  SET 
    is_premium = true,
    premium_until = v_end_date,
    premium_plan_id = v_payment.plan_id
  WHERE id = v_payment.business_id;
  
  -- Crear o actualizar la suscripción
  INSERT INTO business_subscriptions (
    business_id,
    user_id,
    plan_id,
    status,
    start_date,
    end_date
  )
  VALUES (
    v_payment.business_id,
    auth.uid(),
    v_payment.plan_id,
    'active',
    NOW(),
    v_end_date
  );
  
  RAISE NOTICE '✅ Premium activado para: %', (SELECT name FROM businesses WHERE id = v_payment.business_id);
  RAISE NOTICE '✅ Plan: %', v_plan.name;
  RAISE NOTICE '✅ Expira: %', v_end_date;
END $$;

-- ============================================
-- PASO 3: VERIFICAR QUE SE APLICÓ
-- ============================================

SELECT 
  name as negocio,
  is_premium,
  premium_until,
  CASE 
    WHEN is_premium = true AND premium_until > NOW() 
    THEN '✅ PREMIUM ACTIVO - ' || EXTRACT(DAY FROM (premium_until - NOW()))::INTEGER || ' días restantes'
    WHEN is_premium = true AND premium_until <= NOW()
    THEN '⚠️ Premium expirado'
    ELSE '❌ NO premium'
  END as estado
FROM businesses
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Si usaste la OPCIÓN B (automática), ya está todo listo.
-- Si usaste la OPCIÓN A, asegúrate de cambiar los IDs primero.


