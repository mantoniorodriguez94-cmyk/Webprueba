    -- ============================================
    -- VERIFICAR Y CORREGIR CAMPO created_at
    -- ============================================
    -- Este script verifica que el campo created_at existe y funciona correctamente

    -- 1. VERIFICAR SI LA COLUMNA EXISTE
    -- ============================================
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'created_at'
        ) THEN
            -- Si no existe, crearla
            ALTER TABLE public.businesses 
            ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
            
            RAISE NOTICE '✅ Columna created_at creada exitosamente';
        ELSE
            RAISE NOTICE '✓ Columna created_at ya existe';
        END IF;
    END $$;

    -- 2. ASEGURAR QUE TIENE EL DEFAULT CORRECTO
    -- ============================================
    DO $$
    BEGIN
        -- Eliminar default anterior si existe
        ALTER TABLE public.businesses 
        ALTER COLUMN created_at DROP DEFAULT;
        
        -- Establecer el default correcto
        ALTER TABLE public.businesses 
        ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
        
        RAISE NOTICE '✅ Default de created_at actualizado correctamente';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Error al actualizar default: %', SQLERRM;
    END $$;

    -- 3. ASEGURAR QUE ES NOT NULL
    -- ============================================
    DO $$
    BEGIN
        ALTER TABLE public.businesses 
        ALTER COLUMN created_at SET NOT NULL;
        
        RAISE NOTICE '✅ created_at configurado como NOT NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Error al configurar NOT NULL: %', SQLERRM;
    END $$;

    -- 4. ACTUALIZAR NEGOCIOS EXISTENTES SIN FECHA
    -- ============================================
    -- Si hay negocios que no tienen created_at, asignarles la fecha actual
    UPDATE public.businesses 
    SET created_at = timezone('utc'::text, now())
    WHERE created_at IS NULL;

    -- 5. VERIFICAR LA CONFIGURACIÓN FINAL
    -- ============================================
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'businesses'
    AND column_name = 'created_at';

    -- 6. CREAR ÍNDICE PARA MEJORAR CONSULTAS DE FECHA
    -- ============================================
    CREATE INDEX IF NOT EXISTS businesses_created_at_idx 
    ON public.businesses(created_at DESC);

    -- 7. VERIFICAR QUE FUNCIONA CORRECTAMENTE
    -- ============================================
    -- Este query te mostrará los negocios más recientes
    SELECT 
        name,
        created_at,
        EXTRACT(DAY FROM (NOW() - created_at)) as dias_desde_creacion
    FROM public.businesses
    ORDER BY created_at DESC
    LIMIT 5;

    -- ============================================
    -- RESULTADO ESPERADO
    -- ============================================
    -- La columna created_at debe tener:
    -- - data_type: timestamp with time zone
    -- - is_nullable: NO
    -- - column_default: timezone('utc'::text, now())

