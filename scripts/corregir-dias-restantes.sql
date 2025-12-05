-- ============================================
-- CORREGIR DÍAS RESTANTES DE SUSCRIPCIÓN
-- ============================================
-- Este script diagnostica y corrige el problema donde el contador
-- de días restantes no disminuye correctamente

-- ============================================
-- PASO 1: DIAGNÓSTICO - Ver estado actual de las suscripciones
-- ============================================

SELECT 
  b.name as negocio,
  bs.status as estado_suscripcion,
  bs.start_date as fecha_inicio,
  bs.end_date as fecha_fin,
  pp.name as plan,
  pp.billing_period as periodo,
  
  -- Días que han pasado desde el inicio
  EXTRACT(DAY FROM (NOW() - bs.start_date))::INTEGER as dias_transcurridos,
  
  -- Días restantes calculados desde la fecha de fin
  CASE 
    WHEN bs.end_date > NOW() THEN
      EXTRACT(DAY FROM (bs.end_date - NOW()))::INTEGER
    ELSE 0      
  END as dias_restantes_actuales,
  
  -- Duración esperada según el plan
  CASE pp.billing_period
    WHEN 'monthly' THEN 30
    WHEN 'quarterly' THEN 90
    WHEN 'semiannual' THEN 180
    WHEN 'yearly' THEN 365
  END as duracion_esperada_dias,
  
  -- ¿El end_date está bien calculado?
  CASE 
    WHEN pp.billing_period = 'monthly' AND bs.end_date = bs.start_date + INTERVAL '30 days' THEN '✅ Correcto'
    WHEN pp.billing_period = 'quarterly' AND bs.end_date = bs.start_date + INTERVAL '90 days' THEN '✅ Correcto'
    WHEN pp.billing_period = 'semiannual' AND bs.end_date = bs.start_date + INTERVAL '180 days' THEN '✅ Correcto'
    WHEN pp.billing_period = 'yearly' AND bs.end_date = bs.start_date + INTERVAL '365 days' THEN '✅ Correcto'
    ELSE '⚠️ Revisar'
  END as validacion_fecha
  
FROM business_subscriptions bs
JOIN businesses b ON bs.business_id = b.id
JOIN premium_plans pp ON bs.plan_id = pp.id
WHERE bs.status = 'active'
ORDER BY bs.start_date DESC;

-- ============================================
-- PASO 2: CORREGIR - Recalcular end_date basado en start_date + duración del plan
-- ============================================
-- ⚠️ SOLO ejecuta esto si el diagnóstico muestra problemas

-- Opción A: Corregir TODAS las suscripciones activas
UPDATE business_subscriptions bs
SET end_date = CASE 
    WHEN pp.billing_period = 'monthly' THEN bs.start_date + INTERVAL '30 days'
    WHEN pp.billing_period = 'quarterly' THEN bs.start_date + INTERVAL '90 days'
    WHEN pp.billing_period = 'semiannual' THEN bs.start_date + INTERVAL '180 days'
    WHEN pp.billing_period = 'yearly' THEN bs.start_date + INTERVAL '365 days'
  END
FROM premium_plans pp
WHERE bs.plan_id = pp.id
  AND bs.status = 'active';

-- También actualizar premium_until en businesses
UPDATE businesses b
SET premium_until = bs.end_date
FROM business_subscriptions bs
WHERE b.id = bs.business_id
  AND bs.status = 'active'
  AND b.is_premium = true;

-- ============================================
-- PASO 3: VERIFICAR - Confirmar que se corrigieron los datos
-- ============================================

SELECT 
  b.name as negocio,
  bs.start_date as fecha_inicio,
  bs.end_date as fecha_fin,
  b.premium_until as premium_hasta,
  EXTRACT(DAY FROM (bs.end_date - NOW()))::INTEGER as dias_restantes,
  pp.name as plan
FROM business_subscriptions bs
JOIN businesses b ON bs.business_id = b.id
JOIN premium_plans pp ON bs.plan_id = pp.id
WHERE bs.status = 'active'
ORDER BY bs.start_date DESC;

-- ============================================
-- DIAGNÓSTICO ADICIONAL: Ver si premium_until coincide con end_date
-- ============================================

SELECT 
  b.name,
  bs.end_date as suscripcion_fin,
  b.premium_until as business_premium_until,
  CASE 
    WHEN bs.end_date = b.premium_until THEN '✅ Sincronizado'
    ELSE '⚠️ Desincronizado'
  END as estado
FROM business_subscriptions bs
JOIN businesses b ON bs.business_id = b.id
WHERE bs.status = 'active'
  AND b.is_premium = true;



