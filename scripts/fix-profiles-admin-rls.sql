-- ============================================
-- FIX: Permitir que admins vean todos los perfiles
-- ============================================
-- Este script agrega una política RLS para que los administradores
-- puedan ver todos los perfiles de usuarios en el panel admin

-- 1. Eliminar política existente si existe
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Crear política para admins
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 3. También permitir que admins puedan actualizar cualquier perfil (para gestión)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 4. Verificar las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- NOTAS
-- ============================================
-- Esta política permite que usuarios con is_admin = true
-- puedan ver y actualizar todos los perfiles en la tabla profiles.
-- 
-- La política se verifica en tiempo real usando auth.uid() para
-- obtener el usuario actual y comparar su is_admin en la tabla profiles.

