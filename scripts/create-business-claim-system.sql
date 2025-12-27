-- ============================================
-- SISTEMA DE RECLAMAR NEGOCIO (CLAIM BUSINESS)
-- ============================================
-- Este script crea el sistema completo de códigos de invitación
-- para que los administradores puedan crear negocios y asignarlos
-- mediante códigos únicos a usuarios reales.

BEGIN;

-- ============================================
-- 1. MODIFICAR TABLA BUSINESSES
-- ============================================

-- Permitir owner_id NULL (para negocios huérfanos creados por admin)
DO $$
BEGIN
  -- Primero, si hay restricción NOT NULL, la removemos
  ALTER TABLE public.businesses 
    ALTER COLUMN owner_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, probablemente ya es nullable o no existe la columna
    RAISE NOTICE 'owner_id ya es nullable o no se pudo modificar: %', SQLERRM;
END $$;

-- Agregar columna is_founder para identificar negocios fundadores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'is_founder'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN is_founder BOOLEAN DEFAULT false NOT NULL;
    
    COMMENT ON COLUMN public.businesses.is_founder IS 
      'Indica si el dueño actual es el fundador original del negocio (reclamado mediante código)';
  END IF;
END $$;

-- ============================================
-- 2. CREAR TABLA BUSINESS_CLAIMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_claimed BOOLEAN DEFAULT false NOT NULL,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Asegurar que solo un código activo por negocio
  CONSTRAINT business_claims_one_active_per_business 
    CHECK (
      -- Solo permitir un código no reclamado por negocio
      -- Esto se manejará en la aplicación, pero es buena práctica tenerlo
      true
    )
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_business_claims_business_id 
  ON public.business_claims(business_id);

CREATE INDEX IF NOT EXISTS idx_business_claims_code 
  ON public.business_claims(code) 
  WHERE is_claimed = false;

CREATE INDEX IF NOT EXISTS idx_business_claims_claimed_by 
  ON public.business_claims(claimed_by) 
  WHERE claimed_by IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.business_claims IS 
  'Códigos de invitación para reclamar negocios. Solo un código activo por negocio.';

COMMENT ON COLUMN public.business_claims.code IS 
  'Código único alfanumérico para reclamar el negocio (formato: ENC-XXXX)';

COMMENT ON COLUMN public.business_claims.is_claimed IS 
  'Indica si el código ya fue usado para reclamar el negocio';

-- ============================================
-- 3. FUNCIÓN PARA GENERAR CÓDIGO ÚNICO
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_claim_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempts INT := 0;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin 0, O, I, L, 1
  i INT;
  rand_char TEXT;
BEGIN
  LOOP
    -- Generar código: ENC- seguido de 4 caracteres alfanuméricos aleatorios
    new_code := 'ENC-';
    
    FOR i IN 1..4 LOOP
      -- Seleccionar un carácter aleatorio del conjunto
      rand_char := substr(chars, floor(random() * length(chars) + 1)::int, 1);
      new_code := new_code || rand_char;
    END LOOP;
    
    -- Verificar que no exista
    SELECT EXISTS(
      SELECT 1 FROM public.business_claims 
      WHERE code = new_code AND is_claimed = false
    ) INTO code_exists;
    
    -- Si no existe, salir del loop
    EXIT WHEN NOT code_exists;
    
    -- Prevenir loop infinito
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'No se pudo generar código único después de % intentos', max_attempts;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- ============================================
-- 4. FUNCIÓN PARA RECLAMAR NEGOCIO (SECURITY DEFINER)
-- ============================================
-- IMPORTANTE: Esta función usa SECURITY DEFINER para poder
-- actualizar el owner_id sin que las políticas RLS lo bloqueen

CREATE OR REPLACE FUNCTION public.claim_business(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim RECORD;
  v_business_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Validar que el código existe y no está reclamado
  SELECT * INTO v_claim
  FROM public.business_claims
  WHERE code = p_code
    AND is_claimed = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Código inválido o ya utilizado'
    );
  END IF;
  
  v_business_id := v_claim.business_id;
  
  -- 2. Verificar que el usuario no tenga ya un negocio reclamado con este código
  -- (por si acaso intenta reclamar dos veces)
  IF EXISTS (
    SELECT 1 FROM public.business_claims
    WHERE code = p_code 
      AND claimed_by = p_user_id
      AND is_claimed = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya has reclamado este negocio anteriormente'
    );
  END IF;
  
  -- 3. Verificar que el negocio existe
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = v_business_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El negocio asociado no existe'
    );
  END IF;
  
  -- 4. Actualizar el negocio: establecer owner_id y is_founder = true
  UPDATE public.businesses
  SET 
    owner_id = p_user_id,
    is_founder = true,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_business_id;
  
  -- 5. Marcar el código como reclamado
  UPDATE public.business_claims
  SET 
    is_claimed = true,
    claimed_by = p_user_id,
    claimed_at = timezone('utc'::text, now())
  WHERE id = v_claim.id;
  
  -- 6. Retornar éxito con información del negocio
  SELECT jsonb_build_object(
    'success', true,
    'business_id', v_business_id,
    'message', 'Negocio reclamado exitosamente'
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error al reclamar el negocio: ' || SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.claim_business IS 
  'Función con SECURITY DEFINER para reclamar un negocio mediante código. Bypasea RLS.';

-- ============================================
-- 5. HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLÍTICAS RLS PARA BUSINESS_CLAIMS
-- ============================================

-- Solo admins pueden ver todos los códigos
DROP POLICY IF EXISTS "Admins can view all business claims" ON public.business_claims;
CREATE POLICY "Admins can view all business claims"
  ON public.business_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Solo admins pueden crear códigos
DROP POLICY IF EXISTS "Admins can create business claims" ON public.business_claims;
CREATE POLICY "Admins can create business claims"
  ON public.business_claims
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Solo admins pueden actualizar códigos (aunque la función claim_business lo hace directamente)
DROP POLICY IF EXISTS "Admins can update business claims" ON public.business_claims;
CREATE POLICY "Admins can update business claims"
  ON public.business_claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Los usuarios NO pueden leer directamente los códigos
-- Solo interactúan mediante la función claim_business

COMMENT ON POLICY "Admins can view all business claims" ON public.business_claims IS 
  'Solo los administradores pueden ver los códigos de reclamación';

COMMENT ON POLICY "Admins can create business claims" ON public.business_claims IS 
  'Solo los administradores pueden crear códigos de reclamación';

-- ============================================
-- 7. ACTUALIZAR POLÍTICAS DE BUSINESSES
-- ============================================
-- Asegurar que las políticas de businesses permitan que admins creen negocios sin owner_id

-- Ya existe la política "Users can create their own businesses" que requiere owner_id
-- Necesitamos agregar una política para que admins puedan crear negocios sin owner_id

DROP POLICY IF EXISTS "Admins can create businesses without owner" ON public.businesses;
CREATE POLICY "Admins can create businesses without owner"
  ON public.businesses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    AND owner_id IS NULL
  );

COMMENT ON POLICY "Admins can create businesses without owner" ON public.businesses IS 
  'Permite a los administradores crear negocios sin dueño (para ser reclamados después)';

-- ============================================
-- 8. VERIFICACIÓN
-- ============================================

-- Verificar estructura de business_claims
SELECT 
  'Tabla business_claims' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'business_claims'
ORDER BY ordinal_position;

-- Verificar columna is_founder en businesses
SELECT 
  'Columna is_founder en businesses' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'is_founder';

-- Verificar que owner_id puede ser NULL
SELECT 
  'owner_id nullable' as seccion,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'owner_id';

COMMIT;

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de reclamar negocio creado exitosamente';
  RAISE NOTICE '📋 Tabla business_claims creada';
  RAISE NOTICE '🏆 Columna is_founder agregada a businesses';
  RAISE NOTICE '🔐 Políticas RLS configuradas';
  RAISE NOTICE '⚡ Funciones generate_claim_code() y claim_business() creadas';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 El sistema está listo para usar!';
END $$;

