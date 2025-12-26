-- ============================================
-- REPARACIÓN DE POLÍTICAS RLS PARA EL SISTEMA DE CHAT
-- ============================================
-- Este script corrige las políticas RLS para que el chat funcione correctamente
-- Problema identificado: La vista conversation_details no tiene políticas RLS

-- ============================================
-- 1. NOTA SOBRE LA VISTA conversation_details
-- ============================================
-- PostgreSQL no permite políticas RLS directamente en vistas
-- La vista funcionará correctamente si las tablas base (conversations, businesses, auth.users)
-- tienen los permisos adecuados. La vista hereda los permisos de las tablas base.
-- 
-- IMPORTANTE: La vista hace JOIN con auth.users, que es una tabla del esquema auth.
-- Esto debería funcionar correctamente siempre que las políticas RLS de conversations
-- y businesses permitan el acceso adecuado.

-- ============================================
-- 2. VERIFICAR Y CORREGIR POLÍTICAS DE conversations
-- ============================================

-- Eliminar políticas existentes para recrearlas de forma optimizada
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Política SELECT: Usuarios pueden ver conversaciones donde participan
-- OPTIMIZADA: Usa EXISTS en lugar de subconsultas múltiples
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 
      FROM public.businesses b 
      WHERE b.id = conversations.business_id 
      AND b.owner_id = auth.uid()
    )
  );

-- Política INSERT: Usuarios pueden crear conversaciones donde son el user_id
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuarios y dueños pueden actualizar conversaciones
CREATE POLICY "Users can update their conversations"
  ON public.conversations FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 
      FROM public.businesses b 
      WHERE b.id = conversations.business_id 
      AND b.owner_id = auth.uid()
    )
  );

-- ============================================
-- 3. VERIFICAR Y CORREGIR POLÍTICAS DE messages
-- ============================================

-- Eliminar políticas existentes para recrearlas de forma optimizada
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;

-- Política SELECT: Usuarios pueden ver mensajes de sus conversaciones
-- OPTIMIZADA: Usa EXISTS con JOIN para mejor rendimiento
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      LEFT JOIN public.businesses b ON b.id = c.business_id
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()
        OR 
        b.owner_id = auth.uid()
      )
    )
  );

-- Política INSERT: Usuarios pueden enviar mensajes en sus conversaciones
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      LEFT JOIN public.businesses b ON b.id = c.business_id
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()
        OR 
        b.owner_id = auth.uid()
      )
    )
  );

-- Política UPDATE: Usuarios pueden marcar mensajes como leídos
CREATE POLICY "Users can update message read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      LEFT JOIN public.businesses b ON b.id = c.business_id
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()
        OR 
        b.owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- 4. GARANTIZAR QUE LAS TABLAS TENGAN RLS HABILITADO
-- ============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. VERIFICAR/ACTUALIZAR LA VISTA conversation_details
-- ============================================
-- La vista debería existir, solo la recreamos si es necesario para asegurar
-- que está actualizada con la estructura correcta

-- Nota: No podemos usar CASCADE aquí porque puede eliminar dependencias importantes
-- Si la vista existe, la recreamos con CREATE OR REPLACE
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT 
  c.id as conversation_id,
  c.business_id,
  b.name as business_name,
  b.logo_url as business_logo,
  b.owner_id as business_owner_id,
  c.user_id,
  u.raw_user_meta_data->>'full_name' as user_name,
  u.email as user_email,
  c.last_message_at,
  c.unread_count_business,
  c.unread_count_user,
  (SELECT content FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT sender_id FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id,
  c.created_at,
  c.updated_at
FROM public.conversations c
JOIN public.businesses b ON b.id = c.business_id
JOIN auth.users u ON u.id = c.user_id;

-- Comentario sobre la vista
COMMENT ON VIEW public.conversation_details IS 
  'Vista para facilitar consultas de conversaciones con información de usuarios y negocios. Las políticas RLS de las tablas base controlan el acceso.';

-- ============================================
-- 6. VERIFICACIÓN FINAL
-- ============================================

-- Verificar políticas de conversations
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- Verificar políticas de messages
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages');

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS del chat corregidas exitosamente';
  RAISE NOTICE '📋 Políticas optimizadas para conversations y messages';
  RAISE NOTICE '🔐 RLS habilitado en todas las tablas';
  RAISE NOTICE '📊 Vista conversation_details recreada';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 El sistema de chat debería funcionar correctamente ahora!';
END $$;

