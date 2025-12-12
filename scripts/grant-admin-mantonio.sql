-- ============================================
-- OTORGAR PERMISOS DE ADMINISTRADOR COMPLETOS
-- ============================================
-- Este script otorga permisos de administrador completos
-- al usuario: mantoniorodriguez94@gmail.com
-- 
-- IMPORTANTE: Ejecuta esto en Supabase Dashboard > SQL Editor

BEGIN;

-- 1. Asegurar que la columna is_admin existe
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Buscar el usuario por email y otorgar permisos
-- ============================================
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'mantoniorodriguez94@gmail.com';
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- Actualizar el perfil para marcar como admin
    UPDATE public.profiles
    SET is_admin = TRUE
    WHERE id = admin_user_id;
    
    -- Verificar que se actualizó
    IF NOT FOUND THEN
      -- Si no existe el perfil, crearlo
      INSERT INTO public.profiles (id, email, role, is_admin)
      VALUES (admin_user_id, admin_email, 'person', TRUE)
      ON CONFLICT (id) DO UPDATE
      SET is_admin = TRUE;
    END IF;
    
    -- Actualizar los metadatos del usuario en auth.users
    -- Esto es crucial para que funcione correctamente
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      '{"is_admin": true}'::jsonb
    WHERE id = admin_user_id;
    
    RAISE NOTICE '✅ Usuario % configurado como ADMINISTRADOR', admin_email;
    RAISE NOTICE '   User ID: %', admin_user_id;
  ELSE
    RAISE NOTICE '⚠️ Usuario % no encontrado. Asegúrate de que el usuario esté registrado.', admin_email;
  END IF;
END $$;

-- 3. Verificar que funcionó
-- ============================================
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  p.is_admin as is_admin_profile,
  p.role,
  p.full_name,
  CASE 
    WHEN p.is_admin = TRUE AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE THEN '✅ ADMINISTRADOR COMPLETO'
    WHEN p.is_admin = TRUE THEN '⚠️ Admin en profile pero no en metadata'
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE THEN '⚠️ Admin en metadata pero no en profile'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

-- 4. Asegurar políticas RLS que permitan acceso completo
-- ============================================

-- Política para que el usuario pueda ver su propio perfil (incluyendo is_admin)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para que admins puedan ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Política para que admins puedan actualizar cualquier perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
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
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esto para verificar que todo está correcto:

SELECT 
  '✅ VERIFICACIÓN FINAL' as titulo,
  u.email,
  CASE WHEN p.is_admin = TRUE THEN '✅ SÍ' ELSE '❌ NO' END as es_admin_en_profile,
  CASE WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE THEN '✅ SÍ' ELSE '❌ NO' END as es_admin_en_metadata,
  CASE 
    WHEN p.is_admin = TRUE AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '✅ PERFECTO - Usuario tiene permisos completos'
    ELSE '⚠️ REVISAR - Hay una inconsistencia'
  END as resultado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

