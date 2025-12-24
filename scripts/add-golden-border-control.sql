-- Script para agregar control del borde dorado a los negocios premium
-- Este sistema permite a los usuarios activar/desactivar el borde dorado
-- con límites según su tipo de membresía

-- 1. Agregar campo para controlar el borde dorado
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS golden_border_active BOOLEAN DEFAULT false;

-- 2. Comentarios para documentar
COMMENT ON COLUMN businesses.golden_border_active IS 'Indica si el borde dorado está activo para este negocio premium. Límites: mensual=1, anual=2';

-- 3. Índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_businesses_golden_border ON businesses(owner_id, golden_border_active) WHERE golden_border_active = true;

-- 4. Crear función para contar bordes dorados activos de un usuario
CREATE OR REPLACE FUNCTION count_user_active_golden_borders(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM businesses
    WHERE owner_id = p_user_id 
    AND golden_border_active = true
    AND is_premium = true
    AND premium_until > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Crear función para obtener el límite de bordes dorados según membresía
CREATE OR REPLACE FUNCTION get_golden_border_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER := 0;
  v_billing_period TEXT;
BEGIN
  -- Obtener el billing_period de la suscripción activa más reciente
  SELECT pp.billing_period INTO v_billing_period
  FROM business_subscriptions bs
  JOIN businesses b ON bs.business_id = b.id
  JOIN premium_plans pp ON bs.plan_id = pp.id
  WHERE b.owner_id = p_user_id
    AND bs.status = 'active'
    AND bs.end_date > NOW()
  ORDER BY bs.end_date DESC
  LIMIT 1;
  
  -- Asignar límite según el tipo de membresía
  IF v_billing_period = 'yearly' THEN
    v_limit := 2;
  ELSIF v_billing_period = 'monthly' THEN
    v_limit := 1;
  END IF;
  
  RETURN v_limit;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función para verificar si se puede activar el borde dorado
CREATE OR REPLACE FUNCTION can_activate_golden_border(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_premium BOOLEAN;
  v_premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar que el negocio sea premium y esté activo
  SELECT is_premium, premium_until INTO v_is_premium, v_premium_until
  FROM businesses
  WHERE id = p_business_id AND owner_id = p_user_id;
  
  IF NOT v_is_premium OR v_premium_until < NOW() THEN
    RETURN false;
  END IF;
  
  -- Obtener el límite según la membresía del usuario
  v_limit := get_golden_border_limit(p_user_id);
  
  -- Si no tiene membresía activa, no puede activar
  IF v_limit = 0 THEN
    RETURN false;
  END IF;
  
  -- Contar bordes dorados activos (excluyendo el negocio actual)
  v_current_count := (
    SELECT COUNT(*)
    FROM businesses
    WHERE owner_id = p_user_id 
    AND id != p_business_id
    AND golden_border_active = true
    AND is_premium = true
    AND premium_until > NOW()
  );
  
  -- Puede activar si no ha alcanzado el límite
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. Política RLS para golden_border_active (los usuarios pueden ver y modificar sus propios negocios)
-- Las políticas ya existen para la tabla businesses, no necesitamos crear nuevas

-- 8. Actualizar negocios existentes: desactivar todos los bordes dorados por defecto
UPDATE businesses
SET golden_border_active = false
WHERE golden_border_active IS NULL;

-- 9. Opcional: Activar automáticamente el borde dorado para negocios premium existentes
-- (respetando los límites)
DO $$
DECLARE
  v_owner UUID;
  v_business_id UUID;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- Iterar sobre cada propietario con negocios premium
  FOR v_owner IN 
    SELECT DISTINCT owner_id 
    FROM businesses 
    WHERE is_premium = true 
    AND premium_until > NOW()
  LOOP
    -- Obtener el límite para este usuario
    v_limit := get_golden_border_limit(v_owner);
    v_count := 0;
    
    -- Activar el borde dorado hasta alcanzar el límite
    FOR v_business_id IN 
      SELECT id 
      FROM businesses 
      WHERE owner_id = v_owner 
      AND is_premium = true 
      AND premium_until > NOW()
      ORDER BY created_at ASC
    LOOP
      IF v_count < v_limit THEN
        UPDATE businesses 
        SET golden_border_active = true 
        WHERE id = v_business_id;
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Mensajes de confirmación
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Campo golden_border_active agregado exitosamente';
  RAISE NOTICE '✅ Funciones de control de borde dorado creadas';
  RAISE NOTICE '✅ Índices creados para optimizar consultas';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Límites de borde dorado:';
  RAISE NOTICE '   • Membresía Mensual: 1 borde dorado';
  RAISE NOTICE '   • Membresía Anual: 2 bordes dorados';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Sistema de control de borde dorado listo!';
END $$;

