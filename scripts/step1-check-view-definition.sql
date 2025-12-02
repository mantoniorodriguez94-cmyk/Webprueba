-- ============================================
-- PASO 1: CONSULTAR DEFINICIÓN DE LA VIEW
-- ============================================
-- EJECUTA ESTE SCRIPT PRIMERO para ver si tienes la view
-- y cuál es su definición exacta

-- Ver si existe la view
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'business_analytics_summary';

-- Obtener la definición completa
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'business_analytics_summary';

-- Ver todas las views que podrían depender de businesses
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%businesses%'
  AND definition LIKE '%created_at%';

-- Ver el estado actual de la columna created_at
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'created_at';


