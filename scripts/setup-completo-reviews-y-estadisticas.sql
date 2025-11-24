-- ============================================
-- SETUP COMPLETO: REVIEWS Y ESTADÍSTICAS
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query
-- Este script configura TODO el sistema de reviews y analytics

-- ============================================
-- PARTE 1: SISTEMA DE REVIEWS
-- ============================================

    -- 1.1 CREAR TABLA DE REVIEWS
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

    -- 1.2 HABILITAR ROW LEVEL SECURITY PARA REVIEWS
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

    -- 1.3 ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
    DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

    -- 1.4 CREAR POLÍTICAS DE SEGURIDAD PARA REVIEWS
    CREATE POLICY "Anyone can view reviews"
    ON public.reviews
    FOR SELECT
    USING (true);

    CREATE POLICY "Users can create own reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own reviews"
    ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);

    -- 1.5 ÍNDICES PARA MEJOR PERFORMANCE DE REVIEWS
    CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON public.reviews(business_id);
    CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
    CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
    CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at DESC);

    -- 1.6 TRIGGER PARA AUTO-ACTUALIZAR updated_at EN REVIEWS
    DROP TRIGGER IF EXISTS handle_reviews_updated_at ON public.reviews;

    CREATE TRIGGER handle_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 1.7 CREAR VISTA PARA ESTADÍSTICAS DE REVIEWS POR NEGOCIO
DROP VIEW IF EXISTS public.business_review_stats;

CREATE VIEW public.business_review_stats AS
SELECT 
  business_id,
  COUNT(*)::integer as total_reviews,
  AVG(rating)::numeric(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END)::integer as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END)::integer as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END)::integer as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END)::integer as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END)::integer as one_star_count
FROM public.reviews
GROUP BY business_id;

-- 1.8 CREAR VISTA PÚBLICA CON INFORMACIÓN DE USUARIOS
-- Esta vista permite que TODOS los usuarios vean nombres en reviews
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

-- 1.9 FUNCIÓN PARA OBTENER REVIEWS CON INFORMACIÓN DEL USUARIO
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

    -- ============================================
    -- PARTE 2: SISTEMA DE ANALYTICS/ESTADÍSTICAS
    -- ============================================

    -- 2.1 CREAR TABLA PARA TRACKEAR VISTAS/VISITAS
    CREATE TABLE IF NOT EXISTS public.business_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    viewer_ip INET,
    user_agent TEXT,
    
    -- Un usuario puede ver un negocio solo una vez por día
    CONSTRAINT unique_view_per_user_per_day UNIQUE (business_id, viewer_id, DATE(viewed_at))
    );

    CREATE INDEX IF NOT EXISTS idx_business_views_business_id ON public.business_views(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_views_viewed_at ON public.business_views(viewed_at);
    CREATE INDEX IF NOT EXISTS idx_business_views_viewer_id ON public.business_views(viewer_id);

    -- 2.2 CREAR TABLA PARA TRACKEAR GUARDADOS/FAVORITOS
    CREATE TABLE IF NOT EXISTS public.business_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un usuario solo puede guardar un negocio una vez
    CONSTRAINT unique_save_per_user UNIQUE (business_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_business_saves_business_id ON public.business_saves(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_saves_user_id ON public.business_saves(user_id);

    -- 2.3 CREAR TABLA PARA TRACKEAR INTERACCIONES
    CREATE TABLE IF NOT EXISTS public.business_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL, -- 'whatsapp', 'phone', 'message', 'share', 'gallery_view'
    interacted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_business_interactions_business_id ON public.business_interactions(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_interactions_type ON public.business_interactions(interaction_type);
    CREATE INDEX IF NOT EXISTS idx_business_interactions_date ON public.business_interactions(interacted_at);

    -- 2.4 HABILITAR ROW LEVEL SECURITY PARA ANALYTICS
    ALTER TABLE public.business_views ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.business_saves ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.business_interactions ENABLE ROW LEVEL SECURITY;

    -- 2.5 ELIMINAR POLÍTICAS EXISTENTES
    DROP POLICY IF EXISTS "Anyone can register a view" ON public.business_views;
    DROP POLICY IF EXISTS "Owners can view their business stats" ON public.business_views;
    DROP POLICY IF EXISTS "Admins can view all stats" ON public.business_views;
    DROP POLICY IF EXISTS "Authenticated users can save businesses" ON public.business_saves;
    DROP POLICY IF EXISTS "Users can view their saves" ON public.business_saves;
    DROP POLICY IF EXISTS "Owners can view save count" ON public.business_saves;
    DROP POLICY IF EXISTS "Users can delete their saves" ON public.business_saves;
    DROP POLICY IF EXISTS "Users can register interactions" ON public.business_interactions;
    DROP POLICY IF EXISTS "Owners can view their business interactions" ON public.business_interactions;

    -- 2.6 POLÍTICAS PARA BUSINESS_VIEWS
    CREATE POLICY "Anyone can register a view"
    ON public.business_views
    FOR INSERT
    WITH CHECK (true);

    CREATE POLICY "Owners can view their business stats"
    ON public.business_views
    FOR SELECT
    USING (
        business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

    CREATE POLICY "Admins can view all stats"
    ON public.business_views
    FOR SELECT
    USING (
        (
        SELECT (raw_user_meta_data->>'is_admin')::boolean 
        FROM auth.users 
        WHERE id = auth.uid()
        ) = true
    );

    -- 2.7 POLÍTICAS PARA BUSINESS_SAVES
    CREATE POLICY "Authenticated users can save businesses"
    ON public.business_saves
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view their saves"
    ON public.business_saves
    FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY "Owners can view save count"
    ON public.business_saves
    FOR SELECT
    USING (
        business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

    CREATE POLICY "Users can delete their saves"
    ON public.business_saves
    FOR DELETE
    USING (auth.uid() = user_id);

    -- 2.8 POLÍTICAS PARA BUSINESS_INTERACTIONS
    CREATE POLICY "Users can register interactions"
    ON public.business_interactions
    FOR INSERT
    WITH CHECK (true);

    CREATE POLICY "Owners can view their business interactions"
    ON public.business_interactions
    FOR SELECT
    USING (
        business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

    -- 2.9 VISTA: RESUMEN DE ESTADÍSTICAS POR NEGOCIO
    DROP VIEW IF EXISTS public.business_analytics_summary;

    CREATE VIEW public.business_analytics_summary AS
    SELECT 
    b.id as business_id,
    b.name as business_name,
    b.owner_id,
    
    -- Vistas totales
    COUNT(DISTINCT bv.id) as total_views,
    COUNT(DISTINCT bv.viewer_id) as unique_viewers,
    
    -- Vistas últimos 7 días
    COUNT(DISTINCT CASE 
        WHEN bv.viewed_at >= CURRENT_DATE - INTERVAL '7 days' 
        THEN bv.id 
    END) as views_last_7_days,
    
    -- Vistas últimos 30 días
    COUNT(DISTINCT CASE 
        WHEN bv.viewed_at >= CURRENT_DATE - INTERVAL '30 days' 
        THEN bv.id 
    END) as views_last_30_days,
    
    -- Guardados totales
    (SELECT COUNT(*) FROM public.business_saves bs WHERE bs.business_id = b.id) as total_saves,
    
    -- Interacciones totales
    (SELECT COUNT(*) FROM public.business_interactions bi WHERE bi.business_id = b.id) as total_interactions,
    
    -- Mensajes recibidos
    (SELECT COUNT(*) FROM public.messages m 
    JOIN public.conversations c ON m.conversation_id = c.id 
    WHERE c.business_id = b.id AND m.sender_id != b.owner_id) as messages_received,
    
    -- Fecha de la última vista
    MAX(bv.viewed_at) as last_viewed_at,
    
    -- Fecha de creación del negocio
    b.created_at

    FROM public.businesses b
    LEFT JOIN public.business_views bv ON b.id = bv.business_id
    GROUP BY b.id, b.name, b.owner_id, b.created_at;

    -- 2.10 VISTA: VISTAS POR DÍA (ÚLTIMOS 30 DÍAS)
    DROP VIEW IF EXISTS public.business_views_by_day;

    CREATE VIEW public.business_views_by_day AS
    SELECT 
    business_id,
    DATE(viewed_at) as view_date,
    COUNT(DISTINCT id)::integer as views,
    COUNT(DISTINCT viewer_id)::integer as unique_viewers
    FROM public.business_views
    WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY business_id, DATE(viewed_at)
    ORDER BY business_id, view_date;

    -- 2.11 VISTA: INTERACCIONES POR TIPO
    DROP VIEW IF EXISTS public.business_interactions_summary;

    CREATE VIEW public.business_interactions_summary AS
    SELECT 
    business_id,
    interaction_type,
    COUNT(*)::integer as interaction_count,
    COUNT(DISTINCT user_id)::integer as unique_users
    FROM public.business_interactions
    GROUP BY business_id, interaction_type;

    -- ============================================
    -- VERIFICACIÓN FINAL
    -- ============================================

    -- Verifica que todo esté creado correctamente
    DO $$
    BEGIN
    RAISE NOTICE '✅ Sistema de Reviews instalado correctamente';
    RAISE NOTICE '✅ Sistema de Analytics instalado correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tablas creadas:';
    RAISE NOTICE '   - reviews';
    RAISE NOTICE '   - business_views';
    RAISE NOTICE '   - business_saves';
    RAISE NOTICE '   - business_interactions';
    RAISE NOTICE '';
    RAISE NOTICE '👁️ Vistas creadas:';
    RAISE NOTICE '   - business_review_stats';
    RAISE NOTICE '   - business_analytics_summary';
    RAISE NOTICE '   - business_views_by_day';
    RAISE NOTICE '   - business_interactions_summary';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Todo listo! Puedes comenzar a usar el sistema.';
    END $$;

    -- Consultas útiles para verificar
    SELECT 'Reviews registradas:' as info, COUNT(*) as count FROM public.reviews
    UNION ALL
    SELECT 'Vistas registradas:', COUNT(*) FROM public.business_views
    UNION ALL
    SELECT 'Guardados registrados:', COUNT(*) FROM public.business_saves
    UNION ALL
    SELECT 'Interacciones registradas:', COUNT(*) FROM public.business_interactions;

