-- ============================================
-- HABILITAR REALTIME PARA SISTEMA DE MENSAJERÍA
-- ============================================
-- Este script habilita las publicaciones de Realtime en Supabase
-- para que los mensajes aparezcan instantáneamente sin recargar la página

-- 1. HABILITAR REALTIME EN LA TABLA MESSAGES
-- ============================================
-- Esto permite que el frontend escuche inserts en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. HABILITAR REALTIME EN LA TABLA CONVERSATIONS
-- ============================================
-- Esto permite actualizar la lista de conversaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 3. VERIFICAR QUE LAS TABLAS ESTÁN PUBLICADAS
-- ============================================
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('messages', 'conversations');

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime habilitado para mensajes';
  RAISE NOTICE '✅ Realtime habilitado para conversaciones';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Los mensajes ahora aparecerán instantáneamente';
  RAISE NOTICE '📱 No es necesario recargar la página';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Funcionamiento:';
  RAISE NOTICE '   - Usuario envía mensaje → Aparece instantáneamente en el chat del receptor';
  RAISE NOTICE '   - Lista de conversaciones se actualiza automáticamente';
  RAISE NOTICE '   - Contadores de no leídos se actualizan en tiempo real';
END $$;

-- ============================================
-- INSTRUCCIONES ADICIONALES
-- ============================================
/*
NOTA IMPORTANTE:

Si recibes un error como "publication does not exist", significa que 
supabase_realtime no está configurado aún. En ese caso, ejecuta:

-- Crear la publicación si no existe
CREATE PUBLICATION supabase_realtime;

-- Luego ejecuta este script nuevamente
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

---

VERIFICACIÓN:

Para verificar que Realtime está funcionando:

1. Abre dos navegadores diferentes (o uno normal + uno incógnito)
2. En uno, inicia sesión como Usuario Persona
3. En otro, inicia sesión como Dueño del Negocio
4. Usuario envía mensaje al negocio
5. El dueño del negocio debería ver el mensaje aparecer instantáneamente
6. El dueño responde
7. El usuario debería ver la respuesta instantáneamente

---

TROUBLESHOOTING:

Si Realtime no funciona:

1. Verifica que las tablas están en la publicación:
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

2. Verifica que RLS está habilitado:
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('messages', 'conversations');

3. Verifica en el Dashboard de Supabase:
   - Ve a Settings → Database → Publications
   - Busca "supabase_realtime"
   - Verifica que messages y conversations estén listadas

4. Revisa la consola del navegador:
   - Deberías ver mensajes de suscripción de Supabase
   - No deberías ver errores de conexión
*/


