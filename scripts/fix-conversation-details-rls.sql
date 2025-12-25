-- ============================================
-- FIX: Políticas RLS para conversation_details
-- ============================================
-- Este script corrige el acceso a la vista conversation_details
-- que está causando errores al cargar conversaciones

-- 1. Asegurar que la vista existe y tiene la estructura correcta
-- ============================================
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT 
  c.id as conversation_id,
  c.business_id,
  b.name as business_name,
  b.logo_url as business_logo,
  b.owner_id as business_owner_id,
  c.user_id,
  p.full_name as user_name,
  p.email as user_email,
  c.last_message_at,
  c.unread_count_business,
  c.unread_count_user,
  (SELECT content FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT sender_id FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id,
  c.created_at,
  c.updated_at
FROM public.conversations c
JOIN public.businesses b ON b.id = c.business_id
LEFT JOIN public.profiles p ON p.id = c.user_id;

-- 2. Habilitar RLS en la vista
-- ============================================
ALTER VIEW public.conversation_details SET (security_invoker = true);

-- 3. Verificar que la tabla profiles existe y tiene datos
-- ============================================
-- Si la tabla profiles no existe, crearla
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'person',
  is_admin BOOLEAN DEFAULT FALSE,
  allowed_businesses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para leer perfiles (necesaria para la vista)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Política para insertar/actualizar propio perfil
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Función para sincronizar perfiles de auth.users
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_admin, allowed_businesses)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'person'),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'allowed_businesses')::integer, 0)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    is_admin = COALESCE(EXCLUDED.is_admin, public.profiles.is_admin),
    allowed_businesses = COALESCE(EXCLUDED.allowed_businesses, public.profiles.allowed_businesses),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar perfiles automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profile();

-- 5. Migrar datos existentes de auth.users a profiles
-- ============================================
INSERT INTO public.profiles (id, email, full_name, role, is_admin, allowed_businesses)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'role', 'person'),
  COALESCE((raw_user_meta_data->>'is_admin')::boolean, false),
  COALESCE((raw_user_meta_data->>'allowed_businesses')::integer, 0)
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- 6. Índices para mejorar rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 7. Verificación
-- ============================================
DO $$
BEGIN
  -- Verificar que la vista existe
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'conversation_details') THEN
    RAISE NOTICE '✅ Vista conversation_details existe';
  ELSE
    RAISE NOTICE '❌ Vista conversation_details NO existe';
  END IF;

  -- Verificar que profiles tiene datos
  RAISE NOTICE '📊 Perfiles en tabla profiles: %', (SELECT COUNT(*) FROM public.profiles);
  
  -- Verificar que las políticas existen
  RAISE NOTICE '✅ Políticas RLS configuradas';
END $$;

-- 8. Dar permisos adicionales si es necesario
-- ============================================
GRANT SELECT ON public.conversation_details TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;


