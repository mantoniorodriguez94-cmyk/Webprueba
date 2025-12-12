-- ============================================
-- AGREGAR CAMPOS ADMIN A TABLA BUSINESSES
-- ============================================
-- Este script agrega campos necesarios para funcionalidades admin

BEGIN;

-- Campo is_featured (destacado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN is_featured BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.businesses.is_featured IS 'Si el negocio está destacado (aparece primero en búsquedas)';
  END IF;
END $$;

-- Campo max_photos (límite de fotos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'max_photos'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN max_photos INTEGER DEFAULT 5;
    
    COMMENT ON COLUMN public.businesses.max_photos IS 'Límite administrativo de fotos (puede exceder límite del plan)';
  END IF;
END $$;

-- Campo verified_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN verified_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN public.businesses.verified_at IS 'Fecha en que fue verificado por un admin';
  END IF;
END $$;

-- Campo verified_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.businesses.verified_by IS 'ID del admin que verificó el negocio';
  END IF;
END $$;

-- Campo is_verified (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN is_verified BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.businesses.is_verified IS 'Si el negocio fue verificado por un admin';
  END IF;
END $$;

-- Índice para búsquedas de destacados
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured 
ON public.businesses(is_featured) 
WHERE is_featured = true;

COMMIT;

-- Verificar que los campos se agregaron
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'businesses'
AND column_name IN ('is_featured', 'max_photos', 'verified_at', 'verified_by', 'is_verified')
ORDER BY column_name;

