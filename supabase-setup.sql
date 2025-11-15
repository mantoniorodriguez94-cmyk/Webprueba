-- ============================================
-- ENCUENTRA - CONFIGURACIÓN DE SUPABASE
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query

-- 1. CREAR TABLA PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('person', 'company')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- ============================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Usuarios pueden insertar su propio perfil durante el registro
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. FUNCIÓN PARA CREAR PROFILE AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'person')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar pero no bloquear el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. CREAR TRIGGER PARA AUTO-CREAR PROFILES
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- 8. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 9. TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esta consulta para verificar que todo esté bien:
-- SELECT * FROM public.profiles LIMIT 5;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. DESACTIVA LA CONFIRMACIÓN DE EMAIL en Supabase:
--    Dashboard > Authentication > Email Auth > 
--    DESMARCAR "Confirm email"
--
-- 2. Si ya tienes usuarios registrados sin profile:
--    Ejecuta esto para crearles profiles:
/*
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'person') as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
*/

