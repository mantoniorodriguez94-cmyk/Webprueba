-- ============================================
-- CREAR SISTEMA DE ROLES DE ADMINISTRADOR
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query

-- 1. ACTUALIZAR TABLA PROFILES PARA INCLUIR is_admin
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. CREAR ÍNDICE PARA is_admin
-- ============================================
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin) WHERE is_admin = true;

-- 3. FUNCIÓN PARA VERIFICAR SI UN USUARIO ES ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- 4. OTORGAR PERMISOS DE ADMIN A mantoniorodriguez94@gmail.com
-- ============================================
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'mantoniorodriguez94@gmail.com';
  
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
    
    RAISE NOTICE '✅ Usuario mantoniorodriguez94@gmail.com configurado como ADMINISTRADOR';
  ELSE
    RAISE NOTICE '⚠️ Usuario mantoniorodriguez94@gmail.com no encontrado. Primero debe registrarse en la aplicación.';
  END IF;
END $$;

-- 5. ACTUALIZAR POLÍTICAS RLS PARA ADMINISTRADORES
-- ============================================

-- Los administradores pueden ver todos los negocios (ya se puede por la política actual)
-- Los administradores pueden EDITAR cualquier negocio
DROP POLICY IF EXISTS "Admins can update any business" ON public.businesses;
CREATE POLICY "Admins can update any business"
  ON public.businesses
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND (
      auth.uid() = owner_id  -- El dueño
      OR public.is_admin(auth.uid())  -- O un administrador
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
      auth.uid() = owner_id 
      OR public.is_admin(auth.uid())
    )
  );

-- Los administradores pueden ELIMINAR cualquier negocio
DROP POLICY IF EXISTS "Admins can delete any business" ON public.businesses;
CREATE POLICY "Admins can delete any business"
  ON public.businesses
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND (
      auth.uid() = owner_id  -- El dueño
      OR public.is_admin(auth.uid())  -- O un administrador
    )
  );

-- 6. FUNCIÓN AUXILIAR PARA LISTAR ADMINISTRADORES
-- ============================================
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    u.email,
    p.full_name,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_admin = TRUE
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el admin fue configurado correctamente
SELECT 
  u.email,
  p.is_admin,
  p.role,
  p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;

-- Verificar las nuevas políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'businesses'
  AND policyname LIKE '%Admin%';

-- ============================================
-- INSTRUCCIONES ADICIONALES
-- ============================================
/*
PARA AGREGAR MÁS ADMINISTRADORES:

UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'nuevo_admin@email.com');

PARA REMOVER PRIVILEGIOS DE ADMIN:

UPDATE public.profiles
SET is_admin = FALSE
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@email.com');

PARA LISTAR TODOS LOS ADMINISTRADORES:

SELECT * FROM public.list_admins();
*/

RAISE NOTICE '✅ Sistema de administradores configurado exitosamente';
RAISE NOTICE '📝 Administrador actual: mantoniorodriguez94@gmail.com';
RAISE NOTICE '🔐 Los administradores pueden editar y eliminar cualquier negocio';

