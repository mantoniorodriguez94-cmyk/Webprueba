-- ============================================
-- FIX COMPLETO: Permisos de Administrador
-- ============================================
-- Este script asegura que mantoniorodriguez94@gmail.com
-- tenga permisos de administrador completos y funcionales
-- 
-- IMPORTANTE: Ejecuta esto en Supabase Dashboard > SQL Editor

BEGIN;

-- 1. Asegurar que la columna is_admin existe
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin) WHERE is_admin = true;

-- 3. Restaurar permisos de admin para mantoniorodriguez94@gmail.com
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
    
    -- Si no existe el perfil, crearlo
    IF NOT FOUND THEN
      INSERT INTO public.profiles (id, email, role, is_admin)
      VALUES (admin_user_id, admin_email, 'person', TRUE)
      ON CONFLICT (id) DO UPDATE
      SET is_admin = TRUE;
    END IF;
    
    -- Actualizar los metadatos del usuario en auth.users
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

-- 4. Asegurar políticas RLS que permitan leer is_admin
-- ============================================

-- Política para que usuarios puedan ver su propio perfil COMPLETO (incluyendo is_admin)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Permite a los usuarios ver su propio perfil completo, incluyendo is_admin.';

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

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Permite a los administradores ver todos los perfiles de usuarios.';

-- 5. Verificar que funcionó
SELECT 
  u.id as user_id,
  u.email,
  p.is_admin as is_admin_profile,
  (u.raw_user_meta_data->>'is_admin')::boolean as is_admin_metadata,
  p.role,
  p.full_name,
  CASE 
    WHEN p.is_admin = TRUE AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '✅ ADMINISTRADOR COMPLETO - TODO CORRECTO'
    WHEN p.is_admin = TRUE 
    THEN '⚠️ Admin en profile pero no en metadata'
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '⚠️ Admin en metadata pero no en profile'
    ELSE '❌ NO ES ADMIN - EJECUTAR SCRIPT NUEVAMENTE'
  END as estado_final
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

COMMIT;

-- ============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================
-- 1. Verifica que el resultado muestre: ✅ ADMINISTRADOR COMPLETO
-- 2. Cierra sesión completamente en la aplicación
-- 3. Limpia el cache del navegador
-- 4. Inicia sesión nuevamente
-- 5. Ve a /app/dashboard/perfil
-- 6. Debe aparecer el badge "🔥 Administrador"
-- 7. Debe aparecer el botón "Panel de Control Admin"

