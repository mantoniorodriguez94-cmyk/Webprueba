-- ============================================
-- FIX: Políticas RLS para manual_payment_submissions
-- ============================================
-- Este script corrige las políticas RLS para permitir que los admins
-- puedan actualizar los pagos manuales usando su rol de admin (is_admin)

BEGIN;

-- ============================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================
-- Esto asegura que no haya conflictos con políticas anteriores

DROP POLICY IF EXISTS "Users can insert own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Users can view own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can view all manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can update all manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_read_own" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_insert_own" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_update_service" ON public.manual_payment_submissions;

-- ============================================
-- 2. CREAR POLÍTICAS CORRECTAS
-- ============================================

-- Política: Usuarios pueden INSERTAR sus propios pagos manuales
CREATE POLICY "Users can insert own manual payments"
  ON public.manual_payment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden VER sus propios pagos manuales
CREATE POLICY "Users can view own manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Admins pueden VER todos los pagos manuales
CREATE POLICY "Admins can view all manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Política: Admins pueden ACTUALIZAR todos los pagos manuales
-- IMPORTANTE: Esta política verifica que el usuario sea admin usando profiles.is_admin
CREATE POLICY "Admins can update all manual payments"
  ON public.manual_payment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas existen
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'manual_payment_submissions'
ORDER BY policyname;

