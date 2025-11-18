-- ============================================
-- ENCUENTRA - CONFIGURACIÓN DE TABLA BUSINESSES
-- ============================================
-- Ejecuta este SQL PRIMERO en: Supabase Dashboard > SQL Editor > New Query
-- IMPORTANTE: Ejecuta este script ANTES de seed-businesses.sql

-- 1. CREAR TABLA BUSINESSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  address TEXT,
  phone BIGINT,
  whatsapp BIGINT,
  logo_url TEXT,
  gallery_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;

-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- ============================================

-- IMPORTANTE: Todos pueden VER todos los negocios (feed público)
CREATE POLICY "Anyone can view businesses"
  ON public.businesses
  FOR SELECT
  USING (true);

-- Los usuarios autenticados pueden crear negocios
CREATE POLICY "Users can create their own businesses"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Los usuarios pueden actualizar solo sus propios negocios
CREATE POLICY "Users can update their own businesses"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Los usuarios pueden eliminar solo sus propios negocios
CREATE POLICY "Users can delete their own businesses"
  ON public.businesses
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 5. ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS businesses_owner_id_idx ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS businesses_category_idx ON public.businesses(category);
CREATE INDEX IF NOT EXISTS businesses_created_at_idx ON public.businesses(created_at DESC);

-- 6. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_businesses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 7. TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS handle_businesses_updated_at ON public.businesses;

CREATE TRIGGER handle_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_businesses_updated_at();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verifica que la tabla se creó correctamente:
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
ORDER BY ordinal_position;

-- Verifica las políticas RLS:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'businesses';

-- ============================================
-- SIGUIENTE PASO
-- ============================================
-- ✅ Si todo se ejecutó correctamente:
--    Ahora ejecuta: scripts/seed-businesses.sql
--
-- ❌ Si hay errores:
--    - Verifica que la tabla 'profiles' existe (ejecuta supabase-setup.sql primero)
--    - Verifica que auth.users tiene datos
--
-- ============================================

RAISE NOTICE '✅ Tabla businesses creada exitosamente con políticas RLS';
RAISE NOTICE '📝 Siguiente paso: Ejecuta scripts/seed-businesses.sql para agregar los 10 negocios modelo';

