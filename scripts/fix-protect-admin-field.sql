-- ============================================
-- PROTEGER CAMPO is_admin DE SOBRESCRITURA
-- ============================================
-- Este script asegura que el campo is_admin nunca se pierda
-- cuando se actualiza un perfil

-- ============================================
-- PASO 1: Actualizar función handle_new_user para proteger is_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  existing_is_admin BOOLEAN;
BEGIN
  -- Obtener el valor actual de is_admin si el perfil ya existe
  SELECT is_admin INTO existing_is_admin
  FROM public.profiles
  WHERE id = NEW.id;
  
  INSERT INTO public.profiles (id, full_name, role, email, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'person'),
    NEW.email,
    COALESCE(existing_is_admin, FALSE) -- Preservar is_admin si existe
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    email = COALESCE(EXCLUDED.email, profiles.email),
    -- ⚠️ IMPORTANTE: NO sobrescribir is_admin, preservar el valor existente
    is_admin = COALESCE(profiles.is_admin, FALSE);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar pero no bloquear el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- PASO 2: Crear función para proteger is_admin en updates manuales
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_admin_field()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el registro ya tenía is_admin = TRUE, preservarlo
  IF OLD.is_admin = TRUE AND (NEW.is_admin IS NULL OR NEW.is_admin = FALSE) THEN
    -- Solo permitir cambiar is_admin si el usuario que hace el cambio es admin
    -- y explícitamente está cambiando el valor
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    ) THEN
      -- Si no es admin, restaurar el valor anterior
      NEW.is_admin = OLD.is_admin;
      RAISE WARNING 'Intento de cambiar is_admin bloqueado. Solo admins pueden modificar este campo.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 3: Crear trigger para proteger is_admin
-- ============================================
DROP TRIGGER IF EXISTS protect_admin_field_trigger ON public.profiles;

CREATE TRIGGER protect_admin_field_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION public.protect_admin_field();

-- ============================================
-- PASO 4: Verificar la configuración
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- ============================================
-- NOTAS
-- ============================================
-- Esta configuración:
-- 1. Protege is_admin de ser sobrescrito por handle_new_user()
-- 2. Previene cambios accidentales a is_admin (solo admins pueden cambiarlo)
-- 3. Preserva el valor de is_admin si ya está establecido
--
-- Para cambiar is_admin, debes usar un UPDATE explícito como admin:
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = 'user_id';

