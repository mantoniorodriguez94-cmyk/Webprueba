-- Script para agregar email a la tabla profiles y actualizar el trigger
-- Esto asegura que el email se guarde cuando se registra un usuario

-- 1. Agregar columna email si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Actualizar emails existentes desde auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Actualizar la función handle_new_user para incluir email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'person'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    email = COALESCE(EXCLUDED.email, profiles.email);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar pero no bloquear el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- 5. Verificar que todo esté bien
SELECT 
  id, 
  full_name, 
  email, 
  role, 
  created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

