-- ============================================
-- DIAGNÓSTICO COMPLETO: Permisos de Administrador
-- ============================================
-- Este script diagnostica todos los aspectos relacionados
-- con los permisos de administrador para mantoniorodriguez94@gmail.com
-- 
-- IMPORTANTE: Ejecuta esto en Supabase Dashboard > SQL Editor

-- ============================================
-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ============================================
SELECT 
  '1. Estructura de tabla profiles' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('id', 'is_admin', 'role', 'email', 'full_name')
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR USUARIO Y PERFIL
-- ============================================
SELECT 
  '2. Usuario y perfil' as seccion,
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  p.id as profile_id,
  p.is_admin,
  p.role,
  p.email as profile_email,
  p.full_name,
  p.created_at as profile_created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ PERFIL NO EXISTE'
    WHEN p.is_admin IS NULL THEN '⚠️ is_admin es NULL'
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

-- ============================================
-- 3. VERIFICAR METADATOS DEL USUARIO
-- ============================================
SELECT 
  '3. Metadatos del usuario' as seccion,
  u.email,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  u.raw_user_meta_data->>'role' as role_metadata,
  u.raw_user_meta_data as all_metadata
FROM auth.users u
WHERE u.email = 'mantoniorodriguez94@gmail.com';

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  '4. Políticas RLS en profiles' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- 5. VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================
SELECT 
  '5. Estado RLS' as seccion,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================
-- 6. TEST DE LECTURA (SIMULANDO QUERY DEL SERVIDOR)
-- ============================================
-- Este query simula lo que hace la API route
SELECT 
  '6. Test de lectura' as seccion,
  p.id,
  p.is_admin,
  p.role,
  p.email,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ LECTURA EXITOSA - ES ADMIN'
    WHEN p.is_admin IS NULL THEN '⚠️ is_admin es NULL'
    WHEN p.is_admin = FALSE THEN '❌ LECTURA EXITOSA - NO ES ADMIN'
    ELSE '❓ VALOR DESCONOCIDO'
  END as resultado_lectura
FROM public.profiles p
WHERE p.id = (
  SELECT id FROM auth.users WHERE email = 'mantoniorodriguez94@gmail.com'
);

-- ============================================
-- 7. RESUMEN FINAL
-- ============================================
SELECT 
  '7. RESUMEN FINAL' as seccion,
  u.email,
  CASE 
    WHEN p.id IS NULL THEN '❌ PERFIL NO EXISTE - CREAR PERFIL'
    WHEN p.is_admin IS NULL THEN '⚠️ is_admin es NULL - ACTUALIZAR A TRUE'
    WHEN p.is_admin = FALSE THEN '❌ is_admin = FALSE - ACTUALIZAR A TRUE'
    WHEN p.is_admin = TRUE THEN '✅ is_admin = TRUE - CORRECTO'
    ELSE '❓ ESTADO DESCONOCIDO'
  END as accion_requerida,
  CASE 
    WHEN p.is_admin = TRUE 
      AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE
    THEN '✅ TODO CORRECTO - PERMISOS COMPLETOS'
    WHEN p.is_admin = TRUE 
    THEN '⚠️ Admin en profile pero falta en metadata'
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = TRUE
    THEN '⚠️ Admin en metadata pero falta en profile'
    ELSE '❌ FALTA CONFIGURAR PERMISOS'
  END as estado_final
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';

