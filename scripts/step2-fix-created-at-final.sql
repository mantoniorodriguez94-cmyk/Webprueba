-- ============================================
-- CORRECCIÓN COMPLETA DE created_at
-- ============================================
-- IMPORTANTE: Ejecuta primero step1-check-view-definition.sql
-- para ver si tienes alguna view que necesites guardar

-- ============================================
-- PASO 2: ELIMINAR VIEWS QUE DEPENDEN DE created_at
-- ============================================

-- Eliminar business_analytics_summary si existe
DROP VIEW IF EXISTS public.business_analytics_summary CASCADE;

-- Eliminar cualquier otra view que pueda estar relacionada
-- (Ajusta según lo que encontraste en el paso 1)

-- ============================================
-- PASO 3: CORREGIR LA COLUMNA created_at
-- ============================================

-- 3.1: Cambiar tipo a timestamptz
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  TYPE timestamptz
  USING created_at::timestamptz;

-- 3.2: Establecer DEFAULT
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  SET DEFAULT timezone('utc'::text, now());

-- 3.3: Asegurar NOT NULL
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  SET NOT NULL;

-- ============================================
-- PASO 4: RECREAR LA VIEW (si la tenías)
-- ============================================

-- Si en el paso 1 encontraste una definición de business_analytics_summary,
-- pégala aquí. Por ejemplo:

-- CREATE VIEW public.business_analytics_summary AS
-- <PEGAR AQUÍ LA DEFINICIÓN EXACTA DEL PASO 1>;

-- Si no tienes esa view, este paso se omite automáticamente.

-- ============================================
-- PASO 5: VERIFICACIÓN
-- ============================================

-- Verificar la columna
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'created_at';

-- Ver últimos negocios
SELECT 
    name,
    created_at,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS TZ') as fecha_formateada,
    EXTRACT(DAY FROM (NOW() - created_at))::INTEGER as dias_desde_creacion
FROM public.businesses
ORDER BY created_at DESC
LIMIT 5;

-- Resultado esperado:
-- column_name: created_at
-- data_type: timestamp with time zone (o timestamptz)
-- is_nullable: NO
-- column_default: timezone('utc'::text, now())


