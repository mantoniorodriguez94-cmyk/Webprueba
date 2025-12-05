-- ============================================
-- SCRIPT DE VERIFICACIÓN - Setup PayPal Premium
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para verificar
-- que todo está configurado correctamente

-- ============================================
-- 1. VERIFICAR TABLAS EXISTEN
-- ============================================

SELECT 
  'Tablas Premium' as verificacion,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ TODAS LAS TABLAS EXISTEN'
    ELSE '❌ FALTAN TABLAS (' || COUNT(*) || '/4)'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions');

-- ============================================
-- 2. VERIFICAR CAMPOS EN BUSINESSES
-- ============================================

SELECT 
  'Campos Premium en Businesses' as verificacion,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ TODOS LOS CAMPOS EXISTEN'
    ELSE '❌ FALTAN CAMPOS (' || COUNT(*) || '/3)'
  END as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name IN ('is_premium', 'premium_until', 'premium_plan_id');

-- ============================================
-- 3. VERIFICAR PLANES DISPONIBLES
-- ============================================

SELECT 
  'Planes Premium Activos' as verificacion,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ ' || COUNT(*) || ' PLANES DISPONIBLES'
    ELSE '❌ NO HAY PLANES ACTIVOS'
  END as estado
FROM premium_plans
WHERE is_active = true;

-- Ver detalles de los planes
SELECT 
  name as plan,
  price_usd as precio,
  billing_period as periodo,
  is_active as activo
FROM premium_plans
ORDER BY price_usd;

-- ============================================
-- 4. VERIFICAR RLS HABILITADO
-- ============================================

SELECT 
  'RLS (Seguridad)' as verificacion,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ RLS HABILITADO EN TODAS'
    ELSE '❌ RLS NO CONFIGURADO (' || COUNT(*) || '/4)'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions')
  AND rowsecurity = true;

-- ============================================
-- 5. VERIFICAR POLÍTICAS RLS
-- ============================================

SELECT 
  tablename as tabla,
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Configurada'
    ELSE '⚠️ Sin condición'
  END as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions')
ORDER BY tablename, policyname;

-- ============================================
-- 6. VERIFICAR BUCKET DE STORAGE
-- ============================================

SELECT 
  'Storage Bucket' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment_receipts') 
    THEN '✅ BUCKET EXISTE'
    ELSE '❌ BUCKET NO EXISTE - Ejecuta create-storage-bucket.sql'
  END as estado;

-- ============================================
-- 7. VERIFICAR FUNCIONES AUXILIARES
-- ============================================

SELECT 
  'Funciones SQL' as verificacion,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ FUNCIONES CREADAS'
    ELSE '⚠️ ALGUNAS FUNCIONES FALTAN'
  END as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('activate_business_premium', 'check_expired_premiums');

-- Ver funciones
SELECT 
  proname as funcion,
  prosrc as definicion_corta
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('activate_business_premium', 'check_expired_premiums');

-- ============================================
-- 8. ESTADÍSTICAS ACTUALES
-- ============================================

-- Negocios premium activos
SELECT 
  'Negocios Premium Activos' as metrica,
  COUNT(*) as total
FROM businesses
WHERE is_premium = true
  AND premium_until > NOW();

-- Suscripciones por estado
SELECT 
  status,
  COUNT(*) as total
FROM business_subscriptions
GROUP BY status
ORDER BY total DESC;

-- Pagos por estado
SELECT 
  method as metodo,
  status as estado,
  COUNT(*) as total,
  SUM(amount_usd) as monto_total
FROM payments
GROUP BY method, status
ORDER BY total DESC;

-- ============================================
-- RESUMEN FINAL
-- ============================================

SELECT 
  '🎯 RESUMEN DE VERIFICACIÓN' as titulo,
  '' as detalle
UNION ALL
SELECT 
  '✅ Tablas creadas',
  CAST(COUNT(*) as TEXT) || '/4'
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions')
UNION ALL
SELECT 
  '✅ Campos en businesses',
  CAST(COUNT(*) as TEXT) || '/3'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name IN ('is_premium', 'premium_until', 'premium_plan_id')
UNION ALL
SELECT 
  '✅ Planes activos',
  CAST(COUNT(*) as TEXT)
FROM premium_plans
WHERE is_active = true
UNION ALL
SELECT 
  '✅ RLS habilitado',
  CAST(COUNT(*) as TEXT) || '/4 tablas'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions')
  AND rowsecurity = true
UNION ALL
SELECT 
  '✅ Storage bucket',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment_receipts') 
    THEN 'Configurado'
    ELSE 'NO configurado'
  END
UNION ALL
SELECT 
  '✅ Funciones SQL',
  CAST(COUNT(*) as TEXT)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('activate_business_premium', 'check_expired_premiums');

-- ============================================
-- SIGUIENTE PASO
-- ============================================

SELECT 
  '🚀 SIGUIENTE PASO' as accion,
  'Si todo está ✅, configura las variables de entorno y prueba el sistema' as instruccion;



