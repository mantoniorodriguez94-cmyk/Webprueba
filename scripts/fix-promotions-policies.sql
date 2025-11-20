-- Corregir políticas RLS de promociones para hacerlas visibles públicamente cuando estén activas

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Todos pueden ver promociones activas" ON promotions;
DROP POLICY IF EXISTS "Dueños pueden ver todas sus promociones" ON promotions;

-- NUEVA POLÍTICA: Todos pueden ver promociones activas (sin autenticación requerida)
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  );

-- NUEVA POLÍTICA: Dueños pueden ver TODAS sus promociones (activas e inactivas)
CREATE POLICY "Owners can view all their promotions"
  ON promotions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- NUEVA POLÍTICA: Admins pueden ver todas las promociones
CREATE POLICY "Admins can view all promotions"
  ON promotions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      SELECT (user_metadata->>'is_admin')::boolean 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = true
  );

-- Comentarios actualizados
COMMENT ON POLICY "Public can view active promotions" ON promotions IS 'Permite a todos (incluso sin login) ver promociones activas dentro de su rango de fechas';
COMMENT ON POLICY "Owners can view all their promotions" ON promotions IS 'Permite a los dueños ver todas sus promociones, activas o inactivas';
COMMENT ON POLICY "Admins can view all promotions" ON promotions IS 'Permite a los administradores ver todas las promociones del sistema';

