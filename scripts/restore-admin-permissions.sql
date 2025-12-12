-- ============================================
-- RESTAURAR PERMISOS DE ADMINISTRADOR
-- ============================================
-- Este script restaura los permisos de administrador para un usuario
-- Útil si por alguna razón se perdieron los permisos

-- IMPORTANTE: Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real

-- ============================================
-- PASO 1: Asegurar que la columna is_admin existe
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- PASO 2: Restaurar permisos de admin
-- ============================================
-- ⚠️ IMPORTANTE: Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'mantoniorodriguez94@gmail.com';  -- 👈 CAMBIA ESTO A TU EMAIL
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
    
    -- También actualizar los metadatos del usuario
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
    WHERE id = admin_user_id;
    
    RAISE NOTICE '✅ Permisos de ADMINISTRADOR restaurados para: %', admin_email;
  ELSE
    RAISE NOTICE '⚠️ Usuario % no encontrado. Verifica que el email sea correcto.', admin_email;
  END IF;
END $$;

-- ============================================
-- PASO 3: Verificar que funcionó
-- ============================================
-- Ejecuta esta consulta para verificar que tienes permisos de admin:
SELECT 
  u.email,
  p.is_admin,
  p.role,
  p.full_name,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMINISTRADOR'
    ELSE '❌ NO ES ADMINISTRADOR'
  END as estado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';  -- 👈 CAMBIA ESTO A TU EMAIL

-- ============================================
-- PASO 4: Ver todos los administradores
-- ============================================
SELECT 
  u.email,
  p.full_name,
  p.is_admin,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at DESC;

-- ============================================
-- NOTAS
-- ============================================
-- Después de ejecutar este script:
-- 1. Cierra sesión en la aplicación
-- 2. Inicia sesión nuevamente
-- 3. Intenta acceder a /app/admin
-- 
-- Si aún no funciona, verifica:
-- 1. Que el email sea correcto
-- 2. Que el usuario exista en auth.users
-- 3. Que el usuario tenga un registro en profiles

