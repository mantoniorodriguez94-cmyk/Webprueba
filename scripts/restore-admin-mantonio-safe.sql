-- ============================================
-- RESTAURAR PERMISOS DE ADMINISTRADOR (SEGURO)
-- ============================================
-- Este script restaura los permisos de administrador para
-- mantoniorodriguez94@gmail.com sin tocar ningún otro campo
-- 
-- ⚠️ IMPORTANTE: Este script SOLO modifica is_admin
-- NO toca role, is_premium, ni ningún otro campo

BEGIN;

-- 1. Asegurar que la columna is_admin existe
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Restaurar permisos de admin SOLO para el usuario especificado
-- ⚠️ IMPORTANTE: Solo actualiza is_admin, no toca otros campos
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mantoniorodriguez94@gmail.com'
)
AND (
  -- Solo actualizar si el id existe
  EXISTS (SELECT 1 FROM auth.users WHERE email = 'mantoniorodriguez94@gmail.com')
);

-- 3. Actualizar metadatos del usuario en auth.users
-- ⚠️ IMPORTANTE: Solo agrega/actualiza is_admin en metadata, no sobrescribe todo
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  '{"is_admin": true}'::jsonb
WHERE email = 'mantoniorodriguez94@gmail.com';

-- 4. Verificar que funcionó
SELECT 
  u.email,
  p.is_admin as is_admin_profile,
  (u.raw_user_meta_data->>'is_admin')::boolean as is_admin_metadata,
  p.role,
  p.full_name,
  CASE 
    WHEN p.is_admin = TRUE AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '✅ ADMINISTRADOR RESTAURADO CORRECTAMENTE'
    WHEN p.is_admin = TRUE 
    THEN '⚠️ Admin en profile pero no en metadata'
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE 
    THEN '⚠️ Admin en metadata pero no en profile'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

COMMIT;

-- ============================================
-- VERIFICACIÓN ADICIONAL
-- ============================================
-- Verificar que NO se modificaron otros campos críticos
SELECT 
  'Verificación de integridad' as check_type,
  u.email,
  p.role as role_profile,
  u.raw_user_meta_data->>'role' as role_metadata,
  p.is_admin,
  CASE 
    WHEN p.role IS NULL THEN '⚠️ role es NULL'
    WHEN p.role NOT IN ('person', 'company') THEN '⚠️ role inválido'
    ELSE '✅ role correcto'
  END as role_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

