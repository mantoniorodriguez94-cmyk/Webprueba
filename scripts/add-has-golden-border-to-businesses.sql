-- ============================================
-- AGREGAR CAMPO has_golden_border A BUSINESSES
-- ============================================
-- Este script agrega la columna has_golden_border para controlar
-- si el negocio premium muestra borde dorado o no

BEGIN;

-- Agregar columna has_golden_border
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'has_golden_border'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN has_golden_border BOOLEAN DEFAULT true;
    
    COMMENT ON COLUMN public.businesses.has_golden_border IS 
      'Controla si el negocio premium muestra borde dorado. Default true para negocios premium.';
  END IF;
END $$;

-- Actualizar negocios premium existentes para que tengan has_golden_border = true
UPDATE public.businesses 
SET has_golden_border = true 
WHERE is_premium = true 
  AND (has_golden_border IS NULL OR has_golden_border = false);

COMMIT;

-- Verificación
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'has_golden_border';

