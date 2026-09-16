-- ============================================================
-- RESEÑAS: sólo en negocios con dueño
-- ============================================================
--
-- La estrategia de arranque del directorio es sembrar fichas de comercios
-- reales cargadas por el propio equipo, sin dueño (owner_id NULL), para
-- ofrecérselas después a sus dueños con un código de reclamación.
--
-- Con la política anterior —`auth.uid() = user_id` y nada más— cualquiera
-- podía reseñar una de esas fichas. El escenario que eso habilita es el peor
-- posible para la estrategia: se toca la puerta de un comercio para ofrecerle
-- su perfil y el dueño descubre que lleva semanas publicado CON una reseña de
-- una estrella, sin haber podido responder ni saber que existía. Se pasa de
-- hacerle un favor a tener que disculparse.
--
-- Una ficha sin reclamar es un borrador que aún no es de nadie: se puede ver
-- y se puede llamar al negocio, pero no se opina sobre ella.
--
-- De paso se impide que el dueño reseñe su propio negocio, que con la
-- política anterior tampoco estaba bloqueado.

-- ── 1. Comprobación previa ───────────────────────────────────────────────
-- Reseñas que ya existen sobre fichas sin dueño. La política nueva no las
-- borra —sólo afecta a las nuevas—, pero conviene saber si las hay.

SELECT count(*) AS resenas_sobre_fichas_sin_dueno
FROM public.reviews r
JOIN public.businesses b ON b.id = r.business_id
WHERE b.owner_id IS NULL;

-- ── 2. La política ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;

CREATE POLICY "Users can create own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id IS NOT NULL
        AND b.owner_id <> auth.uid()
    )
  );

-- ── 3. Verificación ──────────────────────────────────────────────────────

SELECT polname, pg_get_expr(polwithcheck, polrelid) AS condicion
FROM pg_policy
WHERE polrelid = 'public.reviews'::regclass
  AND polname = 'Users can create own reviews';
