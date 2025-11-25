-- ============================================
-- FIX: Agregar campo updated_at a businesses
-- ============================================
-- Este script soluciona el error: record "new" has no field "updated_at"

-- 1. Agregar columna updated_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'businesses' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.businesses 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        
        RAISE NOTICE '✅ Columna updated_at agregada a businesses';
    ELSE
        RAISE NOTICE 'ℹ️ Columna updated_at ya existe en businesses';
    END IF;
END $$;

-- 2. Verificar que el trigger existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'handle_businesses_updated_at'
    ) THEN
        -- Crear la función si no existe
        CREATE OR REPLACE FUNCTION public.handle_businesses_updated_at()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $func$
        BEGIN
          NEW.updated_at = timezone('utc'::text, now());
          RETURN NEW;
        END;
        $func$;
        
        -- Crear el trigger
        CREATE TRIGGER handle_businesses_updated_at
          BEFORE UPDATE ON public.businesses
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_businesses_updated_at();
        
        RAISE NOTICE '✅ Trigger handle_businesses_updated_at creado';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger handle_businesses_updated_at ya existe';
    END IF;
END $$;

-- 3. Verificar la estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
  AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Copia todo este script
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega el script en una nueva query
-- 4. Ejecuta (Run)
-- 5. Verifica que veas los mensajes de éxito
-- 6. Intenta guardar horarios nuevamente
-- ============================================

RAISE NOTICE '✅ Script completado exitosamente';
RAISE NOTICE '📝 Ahora puedes guardar los horarios sin problemas';











