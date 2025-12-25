-- ============================================
-- ENCUENTRA - AGREGAR CAMPOS DE UBICACIÓN A BUSINESSES
-- ============================================
-- Este script agrega los campos state_id, municipality_id y address_details
-- a la tabla businesses para normalizar la ubicación

BEGIN;

-- 1. Agregar campos de ubicación a la tabla businesses
-- ============================================

-- state_id (Obligatorio)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'state_id'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN state_id INTEGER REFERENCES public.states(id) ON DELETE RESTRICT;
    
    COMMENT ON COLUMN public.businesses.state_id IS 'ID del estado de Venezuela donde está ubicado el negocio';
  END IF;
END $$;

-- municipality_id (Obligatorio)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'municipality_id'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN municipality_id INTEGER REFERENCES public.municipalities(id) ON DELETE RESTRICT;
    
    COMMENT ON COLUMN public.businesses.municipality_id IS 'ID del municipio de Venezuela donde está ubicado el negocio';
  END IF;
END $$;

-- address_details (Opcional - para punto de referencia adicional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'address_details'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN address_details TEXT;
    
    COMMENT ON COLUMN public.businesses.address_details IS 'Detalles adicionales de dirección (punto de referencia, sector, etc.)';
  END IF;
END $$;

-- 2. Crear índices para mejorar búsquedas por ubicación
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_state_id ON public.businesses(state_id);
CREATE INDEX IF NOT EXISTS idx_businesses_municipality_id ON public.businesses(municipality_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(state_id, municipality_id);

-- 3. NOTA IMPORTANTE:
-- ============================================
-- Los campos state_id y municipality_id se agregan como NULL inicialmente
-- para permitir que los negocios existentes sigan funcionando.
-- Una vez que se migren los datos existentes, se puede hacer NOT NULL:
--
-- ALTER TABLE public.businesses 
--   ALTER COLUMN state_id SET NOT NULL,
--   ALTER COLUMN municipality_id SET NOT NULL;
--
-- Por ahora, dejamos que sean NULL para permitir migración gradual.

COMMIT;

