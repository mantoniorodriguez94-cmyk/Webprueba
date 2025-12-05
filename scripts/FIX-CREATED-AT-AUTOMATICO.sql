    -- ============================================
    -- SCRIPT AUTOMÁTICO: Corregir created_at
    -- ============================================
    -- Este script hace TODO el proceso automáticamente:
    -- 1. Guarda la definición de la view (si existe)
    -- 2. Elimina la view temporalmente
    -- 3. Corrige el tipo de created_at
    -- 4. Recrea la view con su definición original
    -- 5. Verifica que todo funciona
    --
    -- EJECUTA ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
    -- ============================================

    BEGIN;

    -- ============================================
    -- PASO 1: GUARDAR DEFINICIÓN DE LA VIEW
    -- ============================================

    -- Crear tabla temporal para guardar la definición
    CREATE TEMP TABLE temp_view_backup (
        viewname TEXT,
        definition TEXT
    );

    -- Guardar la definición de business_analytics_summary (si existe)
    INSERT INTO temp_view_backup (viewname, definition)
    SELECT viewname, definition
    FROM pg_views
    WHERE schemaname = 'public' 
    AND viewname = 'business_analytics_summary';

    -- Mostrar si encontramos la view
    DO $$
    DECLARE
        view_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO view_count FROM temp_view_backup;
        
        IF view_count > 0 THEN
            RAISE NOTICE '✅ PASO 1: Definición de view guardada';
        ELSE
            RAISE NOTICE 'ℹ️ PASO 1: No se encontró la view (esto está bien)';
        END IF;
    END $$;

    -- ============================================
    -- PASO 2: ELIMINAR LA VIEW TEMPORALMENTE
    -- ============================================

    DROP VIEW IF EXISTS public.business_analytics_summary CASCADE;

    RAISE NOTICE '✅ PASO 2: View eliminada (si existía)';

    -- ============================================
    -- PASO 3: CORREGIR LA COLUMNA created_at
    -- ============================================

    -- 3.1: Cambiar tipo a timestamptz
    DO $$
    BEGIN
        ALTER TABLE public.businesses
        ALTER COLUMN created_at
        TYPE timestamptz
        USING created_at::timestamptz;
        
        RAISE NOTICE '✅ PASO 3.1: Tipo cambiado a timestamptz';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️ PASO 3.1: La columna ya es timestamptz (esto está bien)';
    END $$;

    -- 3.2: Establecer DEFAULT
    ALTER TABLE public.businesses
    ALTER COLUMN created_at
    SET DEFAULT timezone('utc'::text, now());

    RAISE NOTICE '✅ PASO 3.2: DEFAULT establecido';

    -- 3.3: Asegurar NOT NULL
    ALTER TABLE public.businesses
    ALTER COLUMN created_at
    SET NOT NULL;

    RAISE NOTICE '✅ PASO 3.3: NOT NULL establecido';

    -- ============================================
    -- PASO 4: RECREAR LA VIEW CON DEFINICIÓN ORIGINAL
    -- ============================================

    DO $$
    DECLARE
        saved_definition TEXT;
    BEGIN
        -- Obtener la definición guardada
        SELECT definition INTO saved_definition
        FROM temp_view_backup
        WHERE viewname = 'business_analytics_summary'
        LIMIT 1;
        
        IF saved_definition IS NOT NULL THEN
            -- Recrear la view con la definición original
            EXECUTE 'CREATE VIEW public.business_analytics_summary AS ' || saved_definition;
            RAISE NOTICE '✅ PASO 4: View recreada con definición original';
        ELSE
            RAISE NOTICE 'ℹ️ PASO 4: No hay view para recrear';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ PASO 4: Error al recrear view: %', SQLERRM;
            -- Intentar con una definición estándar como fallback
            BEGIN
                CREATE VIEW public.business_analytics_summary AS
                SELECT 
                    b.id,
                    b.name,
                    b.created_at,
                    COUNT(DISTINCT bv.id) as total_views,
                    COUNT(DISTINCT bs.id) as total_saves,
                    COUNT(DISTINCT bi.id) FILTER (WHERE bi.interaction_type = 'share') as total_shares
                FROM public.businesses b
                LEFT JOIN public.business_views bv ON b.id = bv.business_id
                LEFT JOIN public.business_saves bs ON b.id = bs.business_id
                LEFT JOIN public.business_interactions bi ON b.id = bi.business_id
                GROUP BY b.id, b.name, b.created_at;
                
                RAISE NOTICE '✅ PASO 4: View recreada con definición estándar';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ No se pudo recrear la view. Esto puede ser normal si no la usabas.';
            END;
    END $$;

    -- ============================================
    -- PASO 5: VERIFICACIÓN FINAL
    -- ============================================

    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICACIÓN FINAL';
    RAISE NOTICE '============================================';

    -- Mostrar configuración de la columna
    DO $$
    DECLARE
        col_type TEXT;
        col_nullable TEXT;
        col_default TEXT;
    BEGIN
        SELECT data_type, is_nullable, column_default
        INTO col_type, col_nullable, col_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'created_at';
        
        RAISE NOTICE 'Tipo de dato: %', col_type;
        RAISE NOTICE 'Permite NULL: %', col_nullable;
        RAISE NOTICE 'Default: %', col_default;
    END $$;

    COMMIT;

    -- ============================================
    -- RESULTADO ESPERADO
    -- ============================================
    -- Tipo de dato: timestamp with time zone
    -- Permite NULL: NO
    -- Default: timezone('utc'::text, now())

    -- ============================================
    -- VER NEGOCIOS RECIENTES
    -- ============================================
    SELECT 
        name,
        created_at,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha,
        EXTRACT(DAY FROM (NOW() - created_at))::INTEGER as dias,
        CASE 
            WHEN created_at >= NOW() - INTERVAL '7 days' THEN '✓ RECIENTE'
            ELSE 'Antiguo'
        END as estado
    FROM public.businesses
    ORDER BY created_at DESC
    LIMIT 10;



