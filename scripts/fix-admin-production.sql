-- ============================================
-- FIX ADMIN EN PRODUCCIÓN - EJECUTAR EN SUPABASE PRODUCCIÓN
-- ============================================
-- Este script configura el usuario como administrador en PRODUCCIÓN
-- 
-- ⚠️ IMPORTANTE: Ejecuta esto en Supabase Dashboard PRODUCCIÓN > SQL Editor
-- 
-- PASO 1: Reemplaza 'TU_EMAIL_AQUI@ejemplo.com' con tu email real
-- PASO 2: Ejecuta el script completo
-- PASO 3: Verifica que el resultado muestre ✅ ADMINISTRADOR COMPLETO

BEGIN;

-- ⚠️ CAMBIAR ESTE EMAIL POR TU EMAIL REAL ⚠️
DO $$
DECLARE
  admin_email TEXT := 'mantoniorodriguez94@gmail.com';  -- ⚠️ CAMBIAR AQUÍ SI ES DIFERENTE
  admin_user_id UUID;
BEGIN
  -- 1. Asegurar que la columna is_admin existe
  ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

  -- 2. Buscar el user_id por email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- 3. Crear o actualizar el perfil con is_admin = TRUE
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (admin_user_id, admin_email, TRUE)
    ON CONFLICT (id) 
    DO UPDATE SET 
      is_admin = TRUE,
      email = COALESCE(profiles.email, admin_email);
    
    -- 4. Actualizar los metadatos del usuario en auth.users
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      '{"is_admin": true}'::jsonb
    WHERE id = admin_user_id;
    
    RAISE NOTICE '✅ Usuario % configurado como ADMINISTRADOR en PRODUCCIÓN', admin_email;
    RAISE NOTICE '   User ID: %', admin_user_id;
  ELSE
    RAISE NOTICE '❌ ERROR: Usuario % no encontrado en auth.users', admin_email;
    RAISE NOTICE '   Verifica que el email sea correcto y que el usuario esté registrado.';
  END IF;
END $$;

-- 5. Crear índice para mejor performance (si no existe)
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx 
ON public.profiles(is_admin) 
WHERE is_admin = true;

-- 6. Asegurar políticas RLS que permitan leer is_admin
-- ============================================

-- Política para que usuarios puedan ver su propio perfil COMPLETO (incluyendo is_admin)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'Permite a los usuarios ver su propio perfil completo, incluyendo is_admin.';

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

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'Permite a los administradores ver todos los perfiles de usuarios.';

-- 7. VERIFICAR QUE FUNCIONÓ
-- ============================================
-- Esto mostrará el estado actual del usuario
SELECT 
  u.id as user_id,
  u.email,
  p.is_admin as is_admin_profile,
  (u.raw_user_meta_data->>'is_admin')::boolean as is_admin_metadata,
  p.role,
  p.full_name,
  p.created_at as profile_created,
  u.created_at as user_created,
  CASE 
    WHEN p.is_admin = TRUE AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '✅ ADMINISTRADOR COMPLETO - TODO CORRECTO'
    WHEN p.is_admin = TRUE 
    THEN '⚠️ Admin en profile pero no en metadata - Debería funcionar igual'
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '⚠️ Admin en metadata pero no en profile - Ejecutar script nuevamente'
    ELSE '❌ NO ES ADMIN - Verificar email y ejecutar script nuevamente'
  END as estado_final
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';  -- ⚠️ CAMBIAR AQUÍ SI ES DIFERENTE

COMMIT;

-- ============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================
-- 1. ✅ Verifica que el resultado muestre: "✅ ADMINISTRADOR COMPLETO"
-- 2. ⚠️ Si muestra error, verifica que el email sea correcto
-- 3. 🔄 Cierra sesión completamente en la aplicación de PRODUCCIÓN
-- 4. 🧹 Limpia el cache del navegador (Ctrl+Shift+R o Cmd+Shift+R)
-- 5. 🔐 Inicia sesión nuevamente en PRODUCCIÓN
-- 6. 👤 Ve a /app/dashboard/perfil
-- 7. ✅ Debe aparecer el badge "🔥 Administrador"
-- 8. ✅ Debe aparecer el botón "Panel de Control Admin"
-- 9. ✅ Debe poder acceder a /app/admin

