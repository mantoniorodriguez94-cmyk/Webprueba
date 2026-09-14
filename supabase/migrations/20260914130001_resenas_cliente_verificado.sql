-- ============================================================
-- RESEÑAS: sello de "Cliente verificado"
-- ============================================================
--
-- La app es un directorio: la compra ocurre fuera, en el local o por
-- teléfono, y la plataforma no la ve nunca. No hay tabla de pedidos, y lo
-- único que se cobra son suscripciones del negocio hacia la plataforma. Así
-- que "sólo quien compró puede reseñar" no se puede comprobar literalmente.
--
-- Lo que sí consta es quién CONTACTÓ a quién: business_interactions guarda
-- los clics de WhatsApp, de teléfono y de mensaje, y conversations guarda los
-- chats abiertos. Eso no prueba una compra, pero sí descarta al que nunca
-- tuvo nada que ver con el negocio.
--
-- Se marca en vez de bloquear, y es deliberado. Hoy hay CERO reseñas en toda
-- la base, y entrar en "Mejores calificados" exige diez. Una barrera dura
-- ahora garantiza que ningún negocio llegue nunca a diez y que esa vitrina
-- —beneficio de Destaca y Patrocina— quede vacía para siempre. El sello da la
-- credibilidad sin costar volumen; cuando lo haya, cerrar es cambiar el
-- trigger por una comprobación que rechace.
--
-- El valor se calcula al escribir y se guarda en la fila. Dos motivos: leer
-- las interacciones está restringido al dueño del negocio, así que un
-- visitante cualquiera no podría calcularlo al leer; y el sello describe lo
-- que era cierto cuando se escribió la reseña, que es lo que debe describir.

-- ── 1. La columna ────────────────────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS cliente_verificado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reviews.cliente_verificado IS
  'La persona había contactado al negocio antes de reseñarlo. Lo calcula un trigger; nadie lo escribe a mano.';

-- ── 2. Quién lo decide ───────────────────────────────────────────────────
-- SECURITY DEFINER porque business_interactions sólo la lee el dueño del
-- negocio, y quien escribe la reseña es justamente otra persona.

CREATE OR REPLACE FUNCTION public.marcar_cliente_verificado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se ignora lo que venga del cliente: el sello no es suyo para ponérselo.
  NEW.cliente_verificado := EXISTS (
    SELECT 1
    FROM public.business_interactions bi
    WHERE bi.business_id = NEW.business_id
      AND bi.user_id = NEW.user_id
      AND bi.interaction_type IN ('whatsapp', 'phone', 'message')
  ) OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.business_id = NEW.business_id
      AND c.user_id = NEW.user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_cliente_verificado ON public.reviews;
CREATE TRIGGER reviews_cliente_verificado
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.marcar_cliente_verificado();

-- ── 3. Que el sello viaje al front ───────────────────────────────────────
-- get_business_reviews declara sus columnas una por una, así que sin esto la
-- nueva no llegaría nunca a la pantalla.

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
  user_email TEXT,
  cliente_verificado BOOLEAN
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
    u.username as user_email,
    r.cliente_verificado
  FROM public.reviews r
  LEFT JOIN public.user_public_info u ON u.id = r.user_id
  WHERE r.business_id = p_business_id
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID) TO anon;

-- ── 4. Verificación ──────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.reviews) AS resenas,
  (SELECT count(*) FROM public.reviews WHERE cliente_verificado) AS verificadas;
