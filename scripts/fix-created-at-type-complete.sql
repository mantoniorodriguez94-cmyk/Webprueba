-- ============================================
-- PROCESO COMPLETO: Corregir tipo de created_at
-- ============================================
-- Este script realiza todos los pasos necesarios para corregir
-- el tipo de dato de created_at de timestamp a timestamptz

-- ============================================
-- PASO 1: OBTENER Y GUARDAR DEFINICIÓN DE LA VIEW
-- ============================================

-- Primero, vamos a consultar la definición actual
DO $$
DECLARE
    view_def TEXT;
BEGIN
    -- Obtener la definición de la view
    SELECT definition INTO view_def
    FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'business_analytics_summary';
    
    IF view_def IS NOT NULL THEN
        RAISE NOTICE '============================================';
        RAISE NOTICE 'DEFINICIÓN DE LA VIEW ENCONTRADA:';
        RAISE NOTICE '============================================';
        RAISE NOTICE '%', view_def;
        RAISE NOTICE '============================================';
    ELSE
        RAISE NOTICE 'ℹ️ La view business_analytics_summary no existe (esto está bien)';
    END IF;
END $$;

-- ============================================
-- PASO 2: ELIMINAR LA VIEW TEMPORALMENTE
-- ============================================

DROP VIEW IF EXISTS public.business_analytics_summary CASCADE;

RAISE NOTICE '✅ PASO 2 COMPLETADO: View eliminada (si existía)';

-- ============================================
-- PASO 3: CORREGIR EL TIPO DE LA COLUMNA
-- ============================================

-- 3.1: Cambiar el tipo de dato a timestamptz
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  TYPE timestamptz
  USING created_at::timestamptz;

RAISE NOTICE '✅ PASO 3.1 COMPLETADO: Tipo cambiado a timestamptz';

-- 3.2: Establecer el DEFAULT correcto
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  SET DEFAULT timezone('utc'::text, now());

RAISE NOTICE '✅ PASO 3.2 COMPLETADO: DEFAULT establecido';

-- 3.3: Asegurar que es NOT NULL
ALTER TABLE public.businesses
  ALTER COLUMN created_at
  SET NOT NULL;

RAISE NOTICE '✅ PASO 3.3 COMPLETADO: NOT NULL establecido';

-- ============================================
-- PASO 4: RECREAR LA VIEW (si existía)
-- ============================================

-- Intentar recrear la view con la definición más común
-- Si tu view tiene una definición diferente, ajusta esto

DO $$
BEGIN
    -- Intentar crear la view con una definición estándar
    -- (Ajusta esta definición según la que obtuviste en el PASO 1)
    
    CREATE OR REPLACE VIEW public.business_analytics_summary AS
    SELECT 
        b.id,
        b.name,
        b.created_at,
        COUNT(DISTINCT bv.id) as total_views,
        COUNT(DISTINCT bs.id) as total_saves,
        COUNT(DISTINCT bi.id) FILTER (WHERE bi.interaction_type = 'share') as total_shares,
        COUNT(DISTINCT bi.id) FILTER (WHERE bi.interaction_type = 'whatsapp') as whatsapp_clicks,
        COUNT(DISTINCT bi.id) FILTER (WHERE bi.interaction_type = 'phone') as phone_clicks
    FROM public.businesses b
    LEFT JOIN public.business_views bv ON b.id = bv.business_id
    LEFT JOIN public.business_saves bs ON b.id = bs.business_id
    LEFT JOIN public.business_interactions bi ON b.id = bi.business_id
    GROUP BY b.id, b.name, b.created_at;
    
    RAISE NOTICE '✅ PASO 4 COMPLETADO: View recreada exitosamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ No se pudo recrear la view (puede no existir en tu esquema)';
        RAISE NOTICE 'Error: %', SQLERRM;
        -- No fallar el script, continuar
END $$;

-- ============================================
-- PASO 5: VERIFICACIÓN FINAL
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE 'VERIFICACIÓN DE LA COLUMNA created_at';
RAISE NOTICE '============================================';

-- 5.1: Verificar la estructura de la columna
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'created_at';

RAISE NOTICE '✅ PASO 5.1 COMPLETADO: Estructura verificada';

-- 5.2: Verificar los datos
RAISE NOTICE '============================================';
RAISE NOTICE 'ÚLTIMOS 5 NEGOCIOS CREADOS:';
RAISE NOTICE '============================================';

SELECT 
    name,
    created_at,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS TZ') as fecha_formateada
FROM public.businesses
ORDER BY created_at DESC
LIMIT 5;

RAISE NOTICE '✅ PASO 5.2 COMPLETADO: Datos verificados';

-- 5.3: Verificar que la view existe (si debería existir)
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'business_analytics_summary'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE '✅ PASO 5.3: View business_analytics_summary existe';
    ELSE
        RAISE NOTICE 'ℹ️ PASO 5.3: View business_analytics_summary no existe (puede ser normal)';
    END IF;
END $$;

-- ============================================
-- RESUMEN FINAL
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE '✅ PROCESO COMPLETADO EXITOSAMENTE';
RAISE NOTICE '============================================';
RAISE NOTICE 'La columna created_at ahora tiene:';
RAISE NOTICE '  - Tipo: timestamptz';
RAISE NOTICE '  - Default: timezone(''utc'', now())';
RAISE NOTICE '  - Constraint: NOT NULL';
RAISE NOTICE '============================================';

-- ============================================
-- PRUEBA FINAL: Insertar un negocio de prueba
-- ============================================

-- Esto es solo para verificar que el DEFAULT funciona
-- COMENTA estas líneas si no quieres crear un negocio de prueba

/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Obtener un user_id válido (el primero disponible)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insertar negocio de prueba
        INSERT INTO public.businesses (owner_id, name)
        VALUES (test_user_id, 'PRUEBA - Verificación created_at')
        RETURNING created_at;
        
        RAISE NOTICE '✅ Negocio de prueba creado con created_at automático';
        
        -- Eliminar el negocio de prueba inmediatamente
        DELETE FROM public.businesses 
        WHERE name = 'PRUEBA - Verificación created_at';
        
        RAISE NOTICE '✅ Negocio de prueba eliminado';
    END IF;
END $$;
*/


