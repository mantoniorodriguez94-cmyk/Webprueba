-- ============================================
-- SISTEMA DE REVIEWS PARA NEGOCIOS
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query

-- 1. CREAR TABLA DE REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Un usuario solo puede dejar una review por negocio
  UNIQUE(business_id, user_id)
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- ============================================

-- Cualquiera puede ver todas las reviews (incluso sin autenticación)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Usuarios autenticados pueden crear reviews
CREATE POLICY "Users can create own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propias reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuarios pueden eliminar sus propias reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at DESC);

-- 6. TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS handle_reviews_updated_at ON public.reviews;

CREATE TRIGGER handle_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. CREAR VISTA PARA ESTADÍSTICAS DE REVIEWS POR NEGOCIO
-- ============================================
CREATE OR REPLACE VIEW public.business_review_stats AS
SELECT 
  business_id,
  COUNT(*) as total_reviews,
  AVG(rating)::numeric(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM public.reviews
GROUP BY business_id;

-- 8. FUNCIÓN PARA OBTENER REVIEWS CON INFORMACIÓN DEL USUARIO
-- ============================================
CREATE OR REPLACE FUNCTION public.get_business_reviews(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  user_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.business_id,
    r.user_id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Usuario') as user_name,
    u.email as user_email
  FROM public.reviews r
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE r.business_id = p_business_id
  ORDER BY r.created_at DESC;
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas consultas para verificar que todo esté bien:
-- SELECT * FROM public.reviews LIMIT 5;
-- SELECT * FROM public.business_review_stats LIMIT 5;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================
-- Descomenta para insertar datos de prueba:
/*
-- Obtén IDs reales de tu base de datos primero
INSERT INTO public.reviews (business_id, user_id, rating, comment) VALUES
  ('ID_DE_NEGOCIO_1', 'ID_DE_USUARIO_1', 5, '¡Excelente servicio! Muy recomendado.'),
  ('ID_DE_NEGOCIO_1', 'ID_DE_USUARIO_2', 4, 'Muy buen negocio, atención rápida.'),
  ('ID_DE_NEGOCIO_2', 'ID_DE_USUARIO_1', 5, 'Productos de alta calidad.');
*/




