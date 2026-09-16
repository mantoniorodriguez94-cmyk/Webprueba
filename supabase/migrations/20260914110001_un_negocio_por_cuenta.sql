-- ============================================================
-- UN NEGOCIO POR CUENTA — garantizado por la base de datos
-- ============================================================
--
-- Hasta ahora el límite vivía únicamente en el navegador, leyendo
-- user_metadata.allowed_businesses. Ese campo lo escribe el propio usuario
-- con supabase.auth.updateUser({ data: { allowed_businesses: 999 } }), así que
-- cualquiera con una cuenta podía crear negocios sin límite desde la consola,
-- o insertar directo contra la API saltándose la pantalla entera. La política
-- RLS sólo comprobaba auth.uid() = owner_id, nunca cuántos negocios había.
--
-- Un índice único parcial cierra eso a nivel del motor: no hay forma de
-- evadirlo desde ningún cliente, y a diferencia de un trigger no tiene
-- condición de carrera entre dos inserciones simultáneas.
--
-- El WHERE es lo importante: los negocios con owner_id NULL son los que crea
-- un admin para que alguien los reclame después (ver create-business-claim-system.sql).
-- Esos quedan fuera del índice a propósito, si no el sistema de reclamos se
-- rompería al segundo negocio huérfano.
--
-- Cubre INSERT y también UPDATE de owner_id, que es como el flujo de reclamar
-- transfiere la propiedad — un trigger BEFORE INSERT se lo habría perdido.

-- ── 1. Comprobación previa ───────────────────────────────────────────────
-- Si esto devuelve filas, el índice fallará. Hay que resolver los duplicados
-- a mano antes de continuar.

SELECT
  owner_id,
  COUNT(*) AS negocios
FROM public.businesses
WHERE owner_id IS NOT NULL
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- ── 2. El candado ────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS businesses_un_negocio_por_cuenta
  ON public.businesses (owner_id)
  WHERE owner_id IS NOT NULL;

COMMENT ON INDEX public.businesses_un_negocio_por_cuenta IS
  'Una cuenta = un negocio. Los negocios sin dueño (para reclamar) quedan exentos.';

-- ── 3. Verificación ──────────────────────────────────────────────────────

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'businesses'
  AND indexname = 'businesses_un_negocio_por_cuenta';
