-- ============================================
-- FIX RLS PARA business_saves
-- ============================================
-- Este script corrige las políticas RLS para la tabla business_saves
-- Resuelve el error {} que aparece después de login cuando se verifica si un negocio está guardado
--
-- IMPORTANTE: Ejecutar en Supabase Dashboard > SQL Editor

BEGIN;

-- ============================================
-- 1. VERIFICAR ESTADO ACTUAL DE RLS
-- ============================================
SELECT 
  'Estado actual de RLS para business_saves' as seccion,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'business_saves';

-- Ver políticas existentes
SELECT 
  'Políticas existentes' as seccion,
  policyname,
  cmd as operacion,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'business_saves';

-- ============================================
-- 2. HABILITAR RLS (si no está habilitado)
-- ============================================
ALTER TABLE public.business_saves ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ELIMINAR POLÍTICAS EXISTENTES (para recrearlas correctamente)
-- ============================================
DROP POLICY IF EXISTS "Users can view their saves" ON public.business_saves;
DROP POLICY IF EXISTS "Authenticated users can save businesses" ON public.business_saves;
DROP POLICY IF EXISTS "Users can delete their saves" ON public.business_saves;
DROP POLICY IF EXISTS "Owners can view who saved their business" ON public.business_saves;
DROP POLICY IF EXISTS "Admins can view all saves" ON public.business_saves;

-- ============================================
-- 4. CREAR POLÍTICAS CORRECTAS
-- ============================================

-- Política SELECT: Usuarios pueden ver sus propios guardados
-- Esta es la política CRÍTICA que resuelve el error {}
CREATE POLICY "Users can view their own saves"
  ON public.business_saves
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view their own saves" ON public.business_saves IS 
  'Permite a los usuarios autenticados ver sus propios guardados. Resuelve el error {} después de login.';

-- Política SELECT: Dueños pueden ver quién guardó su negocio
CREATE POLICY "Owners can view saves of their business"
  ON public.business_saves
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Owners can view saves of their business" ON public.business_saves IS 
  'Permite a los dueños de negocios ver quién guardó su negocio (para estadísticas).';

-- Política SELECT: Admins pueden ver todos los guardados
CREATE POLICY "Admins can view all saves"
  ON public.business_saves
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

COMMENT ON POLICY "Admins can view all saves" ON public.business_saves IS 
  'Permite a los administradores ver todos los guardados del sistema.';

-- Política INSERT: Usuarios autenticados pueden guardar negocios
CREATE POLICY "Authenticated users can save businesses"
  ON public.business_saves
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

COMMENT ON POLICY "Authenticated users can save businesses" ON public.business_saves IS 
  'Permite a usuarios autenticados guardar negocios como favoritos.';

-- Política DELETE: Usuarios pueden eliminar sus propios guardados
CREATE POLICY "Users can delete their own saves"
  ON public.business_saves
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete their own saves" ON public.business_saves IS 
  'Permite a los usuarios eliminar sus propios guardados (quitar de favoritos).';

-- ============================================
-- 5. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- ============================================
SELECT 
  'Políticas creadas' as seccion,
  policyname,
  cmd as operacion,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ SELECT configurado'
    WHEN cmd = 'INSERT' THEN '✅ INSERT configurado'
    WHEN cmd = 'DELETE' THEN '✅ DELETE configurado'
    ELSE '⚠️ Operación desconocida'
  END as estado
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'business_saves'
ORDER BY cmd, policyname;

COMMIT;

-- ============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================
-- 1. Verifica que aparezcan al menos 3 políticas:
--    - Users can view their own saves (SELECT)
--    - Authenticated users can save businesses (INSERT)
--    - Users can delete their own saves (DELETE)
--
-- 2. Prueba la funcionalidad:
--    - Usuario no logueado: No debería poder ver guardados (esperado)
--    - Usuario logueado: Debe poder verificar si guardó un negocio sin errores {}
--    - Usuario logueado: Debe poder guardar/desguardar negocios
--
-- 3. Verifica en la consola del navegador:
--    - No debe aparecer "Error verificando si está guardado: {}"
--    - checkBusinessSaved() debe funcionar correctamente

