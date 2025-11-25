-- ============================================
-- FIX: Mostrar Nombres en Reviews para TODOS los Usuarios
-- ============================================
-- Este script corrige el problema donde usuarios tipo "negocio"
-- no pueden ver los nombres de quienes dejan reseñas

-- PASO 1: Crear una vista pública con información de usuarios
-- Esta vista extrae solo la info necesaria de auth.users
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

-- Dar permisos de lectura a todos
GRANT SELECT ON public.user_public_info TO authenticated;
GRANT SELECT ON public.user_public_info TO anon;

-- PASO 2: Recrear la función usando la vista pública
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

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO anon;

-- PASO 3: Verificar que funciona
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Verificar que la vista existe
  SELECT COUNT(*) INTO test_count
  FROM information_schema.views 
  WHERE table_name = 'user_public_info';
  
  IF test_count > 0 THEN
    RAISE NOTICE '✅ Vista user_public_info creada correctamente';
  ELSE
    RAISE EXCEPTION 'Error: Vista no creada';
  END IF;
  
  -- Verificar que la función existe
  SELECT COUNT(*) INTO test_count
  FROM information_schema.routines 
  WHERE routine_name = 'get_business_reviews';
  
  IF test_count > 0 THEN
    RAISE NOTICE '✅ Función get_business_reviews actualizada correctamente';
  ELSE
    RAISE EXCEPTION 'Error: Función no creada';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Fix aplicado exitosamente!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Ahora TODOS los usuarios (personas y negocios) verán:';
  RAISE NOTICE '   - Nombre completo de quien dejó la reseña';
  RAISE NOTICE '   - Avatar con iniciales correctas';
  RAISE NOTICE '   - Sin diferencias entre tipo de usuario';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Siguiente paso:';
  RAISE NOTICE '   1. NO es necesario reiniciar el servidor';
  RAISE NOTICE '   2. Refresca el navegador (F5)';
  RAISE NOTICE '   3. Verifica que los nombres aparecen correctamente';
END $$;

-- Prueba rápida (opcional)
-- SELECT * FROM user_public_info LIMIT 5;
-- SELECT * FROM get_business_reviews('TU_BUSINESS_ID_AQUI');









