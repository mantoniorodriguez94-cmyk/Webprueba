-- ============================================
-- SEGURIDAD: Solo Administradores Pueden Editar Reviews
-- ============================================
-- Este script refuerza la seguridad para que solo admins editen reviews

-- 1. Eliminar política antigua que permitía a usuarios editar sus reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

-- 2. Nueva política: Solo administradores pueden editar reviews
CREATE POLICY "Only admins can update reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    (
      SELECT (raw_user_meta_data->>'is_admin')::boolean 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = true
  );

-- 3. Mantener la política de eliminación: Solo admins pueden eliminar
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Only admins can delete reviews"
  ON public.reviews
  FOR DELETE
  USING (
    (
      SELECT (raw_user_meta_data->>'is_admin')::boolean 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = true
  );

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de seguridad actualizadas';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Ahora:';
  RAISE NOTICE '   - Solo ADMINISTRADORES pueden editar reviews';
  RAISE NOTICE '   - Solo ADMINISTRADORES pueden eliminar reviews';
  RAISE NOTICE '   - Usuarios regulares solo pueden CREAR reviews';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Siguiente paso:';
  RAISE NOTICE '   1. Reinicia tu servidor: npm run dev';
  RAISE NOTICE '   2. Prueba con un usuario regular (no debe poder editar)';
  RAISE NOTICE '   3. Prueba con un admin (sí debe poder editar)';
END $$;

-- Verificar políticas actuales
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '🔒 Solo Admin'
    ELSE '✅ Todos'
  END as access_level
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;









