-- ============================================================
-- CHAT EN TIEMPO REAL: triggers y publicación
-- ============================================================
--
-- El aviso de mensaje nuevo —el sonido y el badge rojo— se refrescaba cada 30
-- segundos por sondeo. Para pasar a tiempo real, el panel se suscribe a los
-- cambios de `conversations` filtrados por su usuario o su negocio: una sola
-- conexión por persona, sin recibir nada de conversaciones ajenas.
--
-- Eso sólo funciona si se cumplen dos condiciones, y ninguna estaba
-- verificada:
--
--   1. Que insertar un mensaje MODIFIQUE la fila de conversations. El código
--      que envía sólo inserta en `messages` y no toca la conversación, así que
--      esto depende enteramente de dos triggers. Se recrean acá —son CREATE OR
--      REPLACE, así que ejecutarlos de nuevo no rompe nada— porque sin ellos
--      la suscripción se conectaría sin error y no recibiría jamás un aviso.
--      Y de paso los contadores unread_count_* sólo se ponen a cero desde el
--      código: si el trigger no existe, nunca suben de cero.
--
--   2. Que la tabla esté publicada para Realtime. No viene activado por
--      defecto; sin esto, el mismo silencio.

-- ── 1. Mover last_message_at al insertar un mensaje ──────────────────────

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ── 2. Subir el contador de no leídos del lado que recibe ────────────────

CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  conv_user_id UUID;
  conv_business_owner_id UUID;
BEGIN
  SELECT c.user_id, b.owner_id
    INTO conv_user_id, conv_business_owner_id
  FROM public.conversations c
  JOIN public.businesses b ON b.id = c.business_id
  WHERE c.id = NEW.conversation_id;

  IF NEW.sender_id = conv_user_id THEN
    UPDATE public.conversations
    SET unread_count_business = unread_count_business + 1
    WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_id = conv_business_owner_id THEN
    UPDATE public.conversations
    SET unread_count_user = unread_count_user + 1
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_unread_count ON public.messages;
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- ── 3. Publicar la tabla para Realtime ───────────────────────────────────
-- Se añade sólo si no está: repetir el ALTER daría error de duplicado.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END
$$;

-- ── 4. Verificación ──────────────────────────────────────────────────────

SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'public.messages'::regclass
  AND NOT tgisinternal;

SELECT tablename AS publicada_para_realtime
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('conversations', 'messages');
