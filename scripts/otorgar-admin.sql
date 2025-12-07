-- ============================================
-- OTORGAR PERMISOS DE ADMINISTRADOR
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query
--
-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
-- 2. Ejecuta el script completo
-- 3. Verifica que funcionó con la consulta al final

-- ============================================
-- PASO 1: Asegurar que la columna is_admin existe
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- PASO 2: Otorgar permisos de admin a tu usuario
-- ============================================
-- ⚠️ IMPORTANTE: Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'TU_EMAIL@ejemplo.com';  -- 👈 CAMBIA ESTO
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
      CASE 
        WHEN raw_user_meta_data IS NULL THEN '{"is_admin": true}'::jsonb
        ELSE raw_user_meta_data || '{"is_admin": true}'::jsonb
      END
    WHERE id = admin_user_id;
    
    RAISE NOTICE '✅ Usuario % configurado como ADMINISTRADOR', admin_email;
  ELSE
    RAISE NOTICE '⚠️ Usuario % no encontrado. Asegúrate de que el email sea correcto y que el usuario esté registrado.', admin_email;
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
WHERE u.email = 'TU_EMAIL@ejemplo.com';  -- 👈 CAMBIA ESTO también

-- ============================================
-- ALTERNATIVA: Si conoces tu UUID de usuario
-- ============================================
-- Si prefieres usar tu UUID directamente (puedes encontrarlo en auth.users):
-- UPDATE public.profiles
-- SET is_admin = TRUE
-- WHERE id = 'tu-uuid-aqui';

-- ============================================
-- LISTAR TODOS LOS ADMINISTRADORES
-- ============================================
-- Para ver todos los usuarios con permisos de admin:
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at DESC;

