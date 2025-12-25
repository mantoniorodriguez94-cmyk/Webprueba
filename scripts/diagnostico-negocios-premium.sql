-- Script de diagnóstico para verificar negocios premium por usuario
-- Ejecuta esto en Supabase SQL Editor para ver qué está pasando

-- 1. Ver todos los negocios de un usuario específico con su estado premium
-- REEMPLAZA 'TU-USER-ID-AQUI' con el ID real del usuario que tiene el problema
SELECT 
  b.id,
  b.name,
  b.owner_id,
  b.is_premium,
  b.premium_until,
  CASE 
    WHEN b.premium_until > NOW() THEN 'Membresía activa'
    WHEN b.premium_until IS NULL THEN 'Sin membresía'
    ELSE 'Membresía expirada'
  END as estado_premium,
  bs.status as subscription_status,
  bs.start_date as subscription_start,
  bs.end_date as subscription_end,
  pp.billing_period as plan_type
FROM businesses b
LEFT JOIN business_subscriptions bs ON b.id = bs.business_id AND bs.status = 'active'
LEFT JOIN premium_plans pp ON bs.plan_id = pp.id
WHERE b.owner_id = 'TU-USER-ID-AQUI'
ORDER BY b.created_at;

-- 2. Contar negocios premium por usuario
SELECT 
  owner_id,
  COUNT(*) as total_negocios,
  COUNT(CASE WHEN is_premium = true AND premium_until > NOW() THEN 1 END) as negocios_premium_activos,
  COUNT(CASE WHEN is_premium = false OR premium_until IS NULL OR premium_until < NOW() THEN 1 END) as negocios_sin_premium
FROM businesses
WHERE owner_id = 'TU-USER-ID-AQUI'
GROUP BY owner_id;

-- 3. Ver todas las suscripciones activas de ese usuario
SELECT 
  bs.id,
  bs.business_id,
  b.name as business_name,
  bs.status,
  bs.start_date,
  bs.end_date,
  pp.name as plan_name,
  pp.billing_period,
  CASE 
    WHEN bs.end_date > NOW() THEN 'ACTIVA'
    ELSE 'EXPIRADA'
  END as estado_actual
FROM business_subscriptions bs
JOIN businesses b ON bs.business_id = b.id
JOIN premium_plans pp ON bs.plan_id = pp.id
WHERE bs.user_id = 'TU-USER-ID-AQUI'
ORDER BY bs.end_date DESC;

