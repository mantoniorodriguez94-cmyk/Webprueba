-- ============================================
-- ÍNDICES RECOMENDADOS PARA PERFORMANCE
-- Proyecto: Encuentra.app
-- Propósito: Mejorar performance de consultas frecuentes
-- ============================================

-- NOTA: Ejecutar estos comandos en Supabase SQL Editor
-- Solo crear índices que no existan actualmente

-- ============================================
-- 1. BUSINESSES - Consultas de negocios
-- ============================================

-- Índice para buscar negocios por dueño y ordenar por fecha
-- Usado en: Dashboard principal, Mis Negocios
CREATE INDEX IF NOT EXISTS idx_businesses_owner_created 
ON businesses(owner_id, created_at DESC);

-- Índice para búsqueda por categoría
-- Usado en: Filtros del dashboard
CREATE INDEX IF NOT EXISTS idx_businesses_category 
ON businesses(category);

-- Índice para búsqueda activa (si existe campo is_active)
-- CREATE INDEX IF NOT EXISTS idx_businesses_active 
-- ON businesses(is_active) WHERE is_active = true;

-- ============================================
-- 2. MESSAGES - Sistema de mensajería
-- ============================================

-- Índice compuesto para mensajes de una conversación ordenados
-- Usado en: Chat de usuarios y negocios
CREATE INDEX IF NOT EXISTS idx_messages_conv_created 
ON messages(conversation_id, created_at ASC);

-- Índice para mensajes no leídos
-- Usado en: Contadores de mensajes no leídos
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(conversation_id, is_read, sender_id) 
WHERE is_read = false;

-- Índice para mensajes por remitente (útil para queries de usuario)
-- Usado en: Historial de mensajes enviados
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id, created_at DESC);

-- ============================================
-- 3. CONVERSATIONS - Conversaciones
-- ============================================

-- Índice para conversaciones de un usuario
-- Usado en: Lista de conversaciones (usuario persona)
CREATE INDEX IF NOT EXISTS idx_conversations_user 
ON conversations(user_id);

-- Índice para conversaciones de un negocio
-- Usado en: Lista de conversaciones (usuario negocio)
CREATE INDEX IF NOT EXISTS idx_conversations_business 
ON conversations(business_id);

-- Índice compuesto para buscar conversación específica
-- Usado en: Verificar si ya existe una conversación
CREATE INDEX IF NOT EXISTS idx_conversations_user_business 
ON conversations(user_id, business_id);

-- ============================================
-- 4. REVIEWS - Sistema de reseñas
-- ============================================

-- Índice para reseñas de un negocio
-- Usado en: Página de detalle del negocio
CREATE INDEX IF NOT EXISTS idx_reviews_business 
ON reviews(business_id, created_at DESC);

-- Índice para reseñas de un usuario
-- Usado en: Historial de reseñas del usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user 
ON reviews(user_id, created_at DESC);

-- ============================================
-- 5. ANALYTICS - Estadísticas (si existe)
-- ============================================

-- Si tienes tabla de analytics/interactions:
-- CREATE INDEX IF NOT EXISTS idx_analytics_business_type 
-- ON business_interactions(business_id, interaction_type, created_at DESC);

-- ============================================
-- VERIFICACIÓN DE ÍNDICES EXISTENTES
-- ============================================

-- Ejecutar esto para ver todos los índices actuales:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================
-- ANÁLISIS DE PERFORMANCE
-- ============================================

-- Para ver estadísticas de uso de índices:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================
-- MANTENIMIENTO
-- ============================================

-- Reindexar si es necesario (solo en caso de degradación):
-- REINDEX TABLE businesses;
-- REINDEX TABLE messages;
-- REINDEX TABLE conversations;

-- Actualizar estadísticas para el query planner:
-- ANALYZE businesses;
-- ANALYZE messages;
-- ANALYZE conversations;
-- ANALYZE reviews;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. REALTIME EN SUPABASE:
   - Verificar que las tablas 'messages' y 'conversations' tengan Realtime habilitado
   - En Supabase Dashboard: Database > Replication > Habilitar tabla

2. RLS (Row Level Security):
   - Asegurarse de que las políticas RLS no afecten negativamente el performance
   - Políticas muy complejas pueden ralentizar queries incluso con índices

3. MONITORING:
   - Monitorear el uso de índices después de crearlos
   - Algunos índices pueden no ser utilizados si las queries cambian

4. DISK SPACE:
   - Los índices ocupan espacio en disco
   - Índices no utilizados deben ser eliminados

5. WRITE PERFORMANCE:
   - Cada índice ralentiza ligeramente los INSERT/UPDATE
   - Balancear entre read y write performance según uso real
*/


