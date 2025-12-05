-- ============================================
-- AGREGAR POLÍTICAS DE ELIMINACIÓN PARA CONVERSACIONES Y MENSAJES
-- ============================================
-- Este script agrega las políticas RLS necesarias para que los usuarios
-- puedan eliminar sus conversaciones y mensajes

-- 1. POLÍTICA DELETE PARA CONVERSATIONS
-- ============================================
-- Los usuarios pueden eliminar sus propias conversaciones
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;

CREATE POLICY "Users can delete their conversations"
  ON public.conversations FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- 2. POLÍTICA DELETE PARA MESSAGES
-- ============================================
-- Los mensajes se eliminan automáticamente por CASCADE cuando se elimina la conversación
-- Pero también permitimos eliminar mensajes individuales si el usuario lo desea
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON public.messages;

CREATE POLICY "Users can delete messages from their conversations"
  ON public.messages FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT owner_id FROM public.businesses 
      WHERE id = (SELECT business_id FROM public.conversations WHERE id = conversation_id)
    )
  );

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de eliminación agregadas correctamente';
  RAISE NOTICE '🗑️ Los usuarios ahora pueden eliminar sus conversaciones';
  RAISE NOTICE '🗑️ Los dueños de negocios pueden eliminar sus conversaciones';
  RAISE NOTICE '♻️ Los mensajes se eliminan automáticamente con la conversación (CASCADE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Permisos configurados:';
  RAISE NOTICE '   - Usuarios: pueden eliminar conversaciones donde son user_id';
  RAISE NOTICE '   - Dueños: pueden eliminar conversaciones de sus negocios';
END $$;




