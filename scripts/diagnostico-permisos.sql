-- ============================================
-- SCRIPT DE DIAGNÓSTICO DE PERMISOS
-- ============================================
-- Este script te ayudará a verificar por qué los permisos no funcionan correctamente

-- 1. VERIFICAR USUARIOS Y SUS PERMISOS
-- ============================================
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as nombre,
  u.raw_user_meta_data->>'role' as rol,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  p.is_admin as is_admin_profile,
  p.role as profile_role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- 2. VERIFICAR NEGOCIOS Y SUS DUEÑOS
-- ============================================
SELECT 
  b.id,
  b.name as negocio,
  b.owner_id,
  u.email as dueño_email,
  u.raw_user_meta_data->>'full_name' as dueño_nombre,
  b.created_at
FROM public.businesses b
LEFT JOIN auth.users u ON u.id = b.owner_id
ORDER BY b.created_at DESC
LIMIT 20;

-- 3. CONTAR NEGOCIOS POR DUEÑO
-- ============================================
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as nombre,
  COUNT(b.id) as cantidad_negocios
FROM auth.users u
LEFT JOIN public.businesses b ON b.owner_id = u.id
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY cantidad_negocios DESC;

-- 4. VERIFICAR POLÍTICAS RLS DE LA TABLA BUSINESSES
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses';

-- 5. VERIFICAR SI HAY ADMINS CONFIGURADOS
-- ============================================
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  p.is_admin as is_admin_profile,
  CASE 
    WHEN p.is_admin = TRUE OR u.raw_user_meta_data->>'is_admin' = 'true' THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY p.is_admin DESC NULLS LAST;

-- 6. IDENTIFICAR PROBLEMA COMÚN: TODOS LOS NEGOCIOS TIENEN EL MISMO OWNER_ID
-- ============================================
SELECT 
  'PROBLEMA DETECTADO: Todos los negocios tienen el mismo owner_id' as diagnostico
FROM (
  SELECT COUNT(DISTINCT owner_id) as distinct_owners, COUNT(*) as total_negocios
  FROM public.businesses
) sub
WHERE distinct_owners = 1 AND total_negocios > 1;

-- 7. VERIFICAR SI EXISTE LA COLUMNA is_admin EN PROFILES
-- ============================================
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'is_admin';

-- ============================================
-- INSTRUCCIONES
-- ============================================
/*
CÓMO USAR ESTE SCRIPT:

1. Ve a tu panel de Supabase
2. Navega a "SQL Editor"
3. Copia y pega este script completo
4. Ejecuta el script
5. Revisa los resultados de cada sección

INTERPRETACIÓN DE RESULTADOS:

Sección 1: Muestra todos los usuarios y sus permisos
- Busca el usuario con is_admin_metadata o is_admin_profile = true

Sección 2: Muestra los negocios y quién es el dueño
- Si todos tienen el mismo owner_id, ese es el problema

Sección 3: Cuenta cuántos negocios tiene cada usuario
- Ayuda a identificar si un usuario tiene todos los negocios

Sección 4: Muestra las políticas RLS activas
- Verifica que existan políticas de admin

Sección 5: Lista específicamente los admins
- Debe aparecer mantoniorodriguez94@gmail.com como admin

Sección 6: Detecta el problema común automáticamente
- Si aparece un resultado, todos los negocios tienen el mismo dueño

Sección 7: Verifica que la columna is_admin existe
- Si no hay resultados, necesitas ejecutar create-admin-role.sql primero
*/

