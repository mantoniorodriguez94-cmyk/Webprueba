-- ============================================
-- SISTEMA DE MENSAJERÍA PARA NEGOCIOS
-- ============================================
-- Este script crea las tablas necesarias para el sistema de mensajería
-- entre usuarios y negocios

-- 1. TABLA DE CONVERSACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count_business INTEGER DEFAULT 0, -- Mensajes no leídos por el dueño del negocio
  unread_count_user INTEGER DEFAULT 0,     -- Mensajes no leídos por el usuario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id) -- Una conversación única por usuario y negocio
);

-- 2. TABLA DE MENSAJES
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversations_business ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(is_read) WHERE is_read = FALSE;

-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para CONVERSATIONS
-- Los usuarios pueden ver conversaciones donde son participantes
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Los usuarios pueden crear conversaciones
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus conversaciones
CREATE POLICY "Users can update their conversations"
  ON public.conversations FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT owner_id FROM public.businesses WHERE id = business_id
    )
  );

-- Políticas para MESSAGES
-- Los usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT owner_id FROM public.businesses 
      WHERE id = (SELECT business_id FROM public.conversations WHERE id = conversation_id)
    )
  );

-- Los usuarios pueden enviar mensajes
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT user_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT owner_id FROM public.businesses 
      WHERE id = (SELECT business_id FROM public.conversations WHERE id = conversation_id)
    )
  );

-- Los usuarios pueden marcar mensajes como leídos
CREATE POLICY "Users can update message read status"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT owner_id FROM public.businesses 
      WHERE id = (SELECT business_id FROM public.conversations WHERE id = conversation_id)
    )
  );

-- 5. FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar el timestamp de la conversación
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

-- Trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Función para incrementar contador de no leídos
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  conv_user_id UUID;
  conv_business_owner_id UUID;
BEGIN
  -- Obtener el user_id de la conversación y el dueño del negocio
  SELECT 
    c.user_id,
    b.owner_id
  INTO 
    conv_user_id,
    conv_business_owner_id
  FROM public.conversations c
  JOIN public.businesses b ON b.id = c.business_id
  WHERE c.id = NEW.conversation_id;

  -- Si el remitente es el usuario, incrementar contador para el dueño del negocio
  IF NEW.sender_id = conv_user_id THEN
    UPDATE public.conversations
    SET unread_count_business = unread_count_business + 1
    WHERE id = NEW.conversation_id;
  -- Si el remitente es el dueño del negocio, incrementar contador para el usuario
  ELSIF NEW.sender_id = conv_business_owner_id THEN
    UPDATE public.conversations
    SET unread_count_user = unread_count_user + 1
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar contador de no leídos
DROP TRIGGER IF EXISTS trigger_increment_unread_count ON public.messages;
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  conv_user_id UUID;
  conv_business_owner_id UUID;
BEGIN
  -- Obtener participantes de la conversación
  SELECT 
    c.user_id,
    b.owner_id
  INTO 
    conv_user_id,
    conv_business_owner_id
  FROM public.conversations c
  JOIN public.businesses b ON b.id = c.business_id
  WHERE c.id = p_conversation_id;

  -- Marcar mensajes como leídos
  UPDATE public.messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;

  -- Resetear contador correspondiente
  IF p_user_id = conv_user_id THEN
    UPDATE public.conversations
    SET unread_count_user = 0
    WHERE id = p_conversation_id;
  ELSIF p_user_id = conv_business_owner_id THEN
    UPDATE public.conversations
    SET unread_count_business = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. VISTA PARA FACILITAR CONSULTAS
-- ============================================
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
JOIN auth.users u ON u.id = c.user_id
ORDER BY c.last_message_at DESC;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages')
ORDER BY table_name;

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de mensajería creado exitosamente';
  RAISE NOTICE '📋 Tablas creadas: conversations, messages';
  RAISE NOTICE '🔐 Políticas RLS aplicadas correctamente';
  RAISE NOTICE '⚡ Triggers y funciones configurados';
  RAISE NOTICE '📊 Vista conversation_details disponible';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Listo para usar el sistema de mensajería!';
END $$;

