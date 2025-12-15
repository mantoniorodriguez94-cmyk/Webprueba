-- ============================================
-- ACTUALIZAR TRIGGER PARA SOPORTE DE GOOGLE OAUTH
-- ============================================
-- Este script actualiza el trigger handle_new_user para:
-- 1. Soportar avatar_url de Google OAuth
-- 2. Manejar correctamente usuarios de Google que ya existen (vincular cuentas)
-- 3. Extraer información de Google OAuth (picture, name, etc.)

-- 1. AGREGAR COLUMNA avatar_url SI NO EXISTE
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. ACTUALIZAR FUNCIÓN handle_new_user PARA SOPORTAR GOOGLE OAUTH
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
  v_role TEXT;
  v_email TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extraer información del usuario
  -- Google OAuth puede venir con:
  -- - raw_user_meta_data->>'full_name' o 'name'
  -- - raw_user_meta_data->>'avatar_url' o 'picture'
  -- - raw_user_meta_data->>'role' (si existe, sino default 'person')
  
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'person'  -- Default para usuarios de Google OAuth
  );
  
  v_email := NEW.email;
  
  -- Avatar URL puede venir como 'avatar_url', 'picture', o 'avatar_url' desde Google
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Insertar o actualizar perfil
  -- ON CONFLICT asegura que no duplicamos perfiles
  INSERT INTO public.profiles (id, full_name, role, email, avatar_url)
  VALUES (
    NEW.id,
    v_full_name,
    v_role,
    v_email,
    v_avatar_url
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    -- Actualizar solo estos campos, preservando los demás
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    -- Actualizar avatar_url si viene uno nuevo (Google puede actualizar el avatar)
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    -- IMPORTANTE: NO actualizar role en actualizaciones (preservar el existente)
    -- role solo se asigna en el primer INSERT, nunca en UPDATE
    -- is_admin e is_premium nunca se tocan aquí (son campos protegidos)
    updated_at = timezone('utc'::text, now());
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar pero no bloquear el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function que crea/actualiza perfiles automáticamente cuando se crea un usuario en auth.users. 
Soporta usuarios de email/password y OAuth (Google). 
NO modifica is_admin, is_premium, ni otros campos protegidos en actualizaciones.';

-- 4. VERIFICAR QUE EL TRIGGER ESTÉ ACTIVO
-- ============================================
-- El trigger ya debería existir, pero verificamos:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
      
    RAISE NOTICE '✅ Trigger on_auth_user_created creado';
  ELSE
    RAISE NOTICE '✅ Trigger on_auth_user_created ya existe';
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que funciona, puedes ejecutar:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
--   AND column_name IN ('id', 'full_name', 'email', 'role', 'avatar_url', 'is_admin', 'is_premium')
-- ORDER BY ordinal_position;

