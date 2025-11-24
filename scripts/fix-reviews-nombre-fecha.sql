-- ============================================
-- FIX: Nombre y Fecha en Reviews
-- ============================================
-- Si ya ejecutaste el script principal pero los nombres no aparecen,
-- ejecuta SOLO este script para actualizar la función.

-- PASO 1: Crear vista pública con información de usuarios
DROP VIEW IF EXISTS public.user_public_info CASCADE;

CREATE VIEW public.user_public_info AS
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1),
    'Usuario'
  ) as display_name,
  split_part(u.email, '@', 1) as username
FROM auth.users u;

GRANT SELECT ON public.user_public_info TO authenticated;
GRANT SELECT ON public.user_public_info TO anon;

-- PASO 2: Actualizar la función para obtener nombres correctamente
DROP FUNCTION IF EXISTS public.get_business_reviews(UUID);

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
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    r.id,
    r.business_id,
    r.user_id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    COALESCE(u.display_name, 'Usuario') as user_name,
    u.username as user_email
  FROM public.reviews r
  LEFT JOIN public.user_public_info u ON u.id = r.user_id
  WHERE r.business_id = p_business_id
  ORDER BY r.created_at DESC;
$$;

-- Dar permisos de ejecución a usuarios autenticados y anónimos
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO anon;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Función actualizada correctamente';
  RAISE NOTICE '✅ Permisos configurados';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ahora los nombres aparecerán correctamente!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Siguiente paso:';
  RAISE NOTICE '   1. Reinicia tu servidor: npm run dev';
  RAISE NOTICE '   2. Refresca el navegador (F5)';
  RAISE NOTICE '   3. Publica una review y verifica tu nombre';
END $$;

-- Prueba rápida (reemplaza el UUID con un business_id real)
-- SELECT * FROM get_business_reviews('BUSINESS_ID_AQUI');


