-- Crear tablas para sistema de analíticas y estadísticas de negocios

-- Tabla para trackear visitas/vistas de negocios
CREATE TABLE IF NOT EXISTS business_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  viewer_ip INET,
  user_agent TEXT,
  
  -- Índices para consultas rápidas
  CONSTRAINT unique_view_per_user_per_day UNIQUE (business_id, viewer_id, DATE(viewed_at))
);

CREATE INDEX IF NOT EXISTS idx_business_views_business_id ON business_views(business_id);
CREATE INDEX IF NOT EXISTS idx_business_views_viewed_at ON business_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_business_views_viewer_id ON business_views(viewer_id);

-- Tabla para trackear cuando un negocio es guardado/favorito
CREATE TABLE IF NOT EXISTS business_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Un usuario solo puede guardar un negocio una vez
  CONSTRAINT unique_save_per_user UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_saves_business_id ON business_saves(business_id);
CREATE INDEX IF NOT EXISTS idx_business_saves_user_id ON business_saves(user_id);

-- Tabla para trackear clics en botones de contacto
CREATE TABLE IF NOT EXISTS business_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL, -- 'whatsapp', 'phone', 'message', 'share', 'gallery_view'
  interacted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_interactions_business_id ON business_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_interactions_type ON business_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_business_interactions_date ON business_interactions(interacted_at);

-- Habilitar RLS
ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para business_views

-- Cualquiera puede registrar una vista
CREATE POLICY "Anyone can register a view"
  ON business_views
  FOR INSERT
  WITH CHECK (true);

-- Solo el dueño puede ver las estadísticas de su negocio
CREATE POLICY "Owners can view their business stats"
  ON business_views
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Admins pueden ver todas las estadísticas
CREATE POLICY "Admins can view all stats"
  ON business_views
  FOR SELECT
  USING (
    (
      SELECT (user_metadata->>'is_admin')::boolean 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = true
  );

-- Políticas para business_saves

-- Usuarios autenticados pueden guardar negocios
CREATE POLICY "Authenticated users can save businesses"
  ON business_saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden ver sus propios guardados
CREATE POLICY "Users can view their saves"
  ON business_saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Dueños pueden ver quién guardó su negocio (sin info personal)
CREATE POLICY "Owners can view save count"
  ON business_saves
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Usuarios pueden eliminar sus guardados
CREATE POLICY "Users can delete their saves"
  ON business_saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para business_interactions

-- Usuarios pueden registrar interacciones
CREATE POLICY "Users can register interactions"
  ON business_interactions
  FOR INSERT
  WITH CHECK (true);

-- Dueños pueden ver interacciones de su negocio
CREATE POLICY "Owners can view their business interactions"
  ON business_interactions
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Vistas para estadísticas agregadas

-- Vista: Resumen de estadísticas por negocio
CREATE OR REPLACE VIEW business_analytics_summary AS
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
  (SELECT COUNT(*) FROM business_saves bs WHERE bs.business_id = b.id) as total_saves,
  
  -- Interacciones totales
  (SELECT COUNT(*) FROM business_interactions bi WHERE bi.business_id = b.id) as total_interactions,
  
  -- Mensajes recibidos
  (SELECT COUNT(*) FROM messages m 
   JOIN conversations c ON m.conversation_id = c.id 
   WHERE c.business_id = b.id AND m.sender_id != b.owner_id) as messages_received,
  
  -- Fecha de la última vista
  MAX(bv.viewed_at) as last_viewed_at,
  
  -- Fecha de creación del negocio
  b.created_at

FROM businesses b
LEFT JOIN business_views bv ON b.id = bv.business_id
GROUP BY b.id, b.name, b.owner_id, b.created_at;

-- Vista: Vistas por día (últimos 30 días)
CREATE OR REPLACE VIEW business_views_by_day AS
SELECT 
  business_id,
  DATE(viewed_at) as view_date,
  COUNT(DISTINCT id) as views,
  COUNT(DISTINCT viewer_id) as unique_viewers
FROM business_views
WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY business_id, DATE(viewed_at)
ORDER BY business_id, view_date;

-- Vista: Interacciones por tipo
CREATE OR REPLACE VIEW business_interactions_summary AS
SELECT 
  business_id,
  interaction_type,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT user_id) as unique_users
FROM business_interactions
GROUP BY business_id, interaction_type;

-- Comentarios
COMMENT ON TABLE business_views IS 'Registra cada vista/visita a un negocio';
COMMENT ON TABLE business_saves IS 'Registra cuando un usuario guarda/favorito un negocio';
COMMENT ON TABLE business_interactions IS 'Registra interacciones con botones de contacto';
COMMENT ON VIEW business_analytics_summary IS 'Resumen completo de estadísticas por negocio';
COMMENT ON VIEW business_views_by_day IS 'Vistas diarias de negocios (últimos 30 días)';
COMMENT ON VIEW business_interactions_summary IS 'Resumen de interacciones por tipo';

