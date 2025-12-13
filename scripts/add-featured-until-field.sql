-- ============================================
-- AGREGAR CAMPO featured_until A TABLA BUSINESSES
-- ============================================
-- Este script agrega el campo featured_until para controlar la duración del destacado

BEGIN;

-- Campo featured_until (fecha hasta cuando está destacado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN featured_until TIMESTAMPTZ;
    
    COMMENT ON COLUMN public.businesses.featured_until IS 'Fecha hasta cuando el negocio está destacado (null = no tiene fecha límite de destacado)';
  END IF;
END $$;

-- Índice para búsquedas eficientes de destacados activos
CREATE INDEX IF NOT EXISTS idx_businesses_featured_until 
ON public.businesses(featured_until) 
WHERE is_featured = true AND featured_until IS NOT NULL;

COMMIT;

-- Verificar que el campo se agregó
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'businesses'
AND column_name = 'featured_until';

