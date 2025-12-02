-- ============================================
-- DEBUG: Verificar Estado del Pago Premium
-- ============================================
-- Ejecuta este script para diagnosticar qué pasó con tu pago

-- 1. Ver el último pago realizado
SELECT 
  id,
  business_id,
  user_id,
  method,
  amount_usd,
  status,
  created_at,
  external_id
FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver el negocio y su estado premium
-- REEMPLAZA 'TU-NEGOCIO-ID' con el ID de tu negocio
SELECT 
  id,
  name,
  owner_id,
  is_premium,
  premium_until,
  premium_plan_id,
  created_at
FROM businesses
WHERE owner_id = auth.uid()  -- Tu usuario
ORDER BY created_at DESC;

-- 3. Ver suscripciones del negocio
SELECT 
  bs.id,
  bs.business_id,
  bs.status,
  bs.start_date,
  bs.end_date,
  pp.name as plan_name,
  pp.price_usd,
  b.name as business_name,
  b.is_premium
FROM business_subscriptions bs
JOIN premium_plans pp ON bs.plan_id = pp.id
JOIN businesses b ON bs.business_id = b.id
WHERE bs.user_id = auth.uid()
ORDER BY bs.created_at DESC;

-- 4. Ver si el negocio debería estar en destacados
SELECT 
  id,
  name,
  is_premium,
  premium_until,
  CASE 
    WHEN is_premium = true AND premium_until > NOW() THEN '✅ SÍ - Debe aparecer en destacados'
    WHEN is_premium = true AND premium_until <= NOW() THEN '⚠️ Premium expirado'
    ELSE '❌ NO - No es premium'
  END as estado_destacados,
  CASE 
    WHEN premium_until IS NOT NULL THEN 
      EXTRACT(DAY FROM (premium_until - NOW())) || ' días restantes'
    ELSE 'N/A'
  END as tiempo_restante
FROM businesses
WHERE owner_id = auth.uid();

-- 5. Verificar pagos completados vs estado del negocio
SELECT 
  p.id as payment_id,
  p.status as payment_status,
  p.created_at as payment_date,
  b.name as business_name,
  b.is_premium,
  b.premium_until,
  CASE 
    WHEN p.status = 'completed' AND b.is_premium = false 
    THEN '🚨 PROBLEMA: Pago completado pero negocio NO es premium'
    WHEN p.status = 'completed' AND b.is_premium = true 
    THEN '✅ OK: Pago completado y negocio ES premium'
    WHEN p.status = 'pending'
    THEN '⏳ Pago pendiente'
    ELSE '❓ Verificar estado'
  END as diagnostico
FROM payments p
JOIN businesses b ON p.business_id = b.id
WHERE p.user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- SOLUCIÓN SI HAY PROBLEMA
-- ============================================

-- Si el pago está "completed" pero el negocio no es premium,
-- ejecuta esto (REEMPLAZA los IDs):

/*
-- Obtener IDs del último pago
WITH ultimo_pago AS (
  SELECT 
    business_id,
    plan_id
  FROM payments
  WHERE user_id = auth.uid()
    AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1
)
-- Activar premium manualmente
UPDATE businesses
SET 
  is_premium = true,
  premium_until = NOW() + INTERVAL '30 days',  -- o '1 year' para anual
  premium_plan_id = (SELECT plan_id FROM ultimo_pago)
WHERE id = (SELECT business_id FROM ultimo_pago);

-- Verificar que se aplicó
SELECT id, name, is_premium, premium_until
FROM businesses
WHERE owner_id = auth.uid();
*/


