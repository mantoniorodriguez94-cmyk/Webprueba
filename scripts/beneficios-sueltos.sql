-- ============================================================
-- BENEFICIOS SUELTOS — concesiones manuales con vencimiento
-- ============================================================
--
-- Hasta ahora todo beneficio derivaba del plan: tier 3 daba borde dorado,
-- tier 2 daba prioridad, y así. Esto agrega una segunda vía, independiente
-- del plan, que sólo un admin concede desde el panel y que caduca sola.
--
-- La regla de lectura es siempre la misma, en los cuatro casos:
--
--     tiene el beneficio  =  se lo da su plan  O  tiene concesión vigente
--
-- Nunca al revés: una concesión vencida no le quita nada a quien su plan ya
-- se lo daba. Por eso son columnas de fecha y no booleanos — un booleano
-- habría que ir a apagarlo a mano, y en la práctica nadie lo apaga.
--
-- NULL     = sin concesión
-- futuro   = concedido hasta esa fecha
-- pasado   = caducado, se ignora
--
-- Hubo un sistema parecido antes (golden_border_expires_at, chat_expires_at)
-- que se eliminó para que todo derivara del plan. La diferencia ahora es que
-- estas columnas no compiten con el plan sino que lo complementan, y que el
-- panel es el único que las escribe.
--
-- OJO con el orden: este script va ANTES de limite-fotos-por-plan.sql, que
-- lee perk_fotos_extra para calcular el tope real.

-- ── 1. Las columnas ──────────────────────────────────────────────────────

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS perk_borde_dorado_hasta timestamptz,
  ADD COLUMN IF NOT EXISTS perk_promociones_hasta  timestamptz,
  ADD COLUMN IF NOT EXISTS perk_prioridad_hasta    timestamptz,
  ADD COLUMN IF NOT EXISTS perk_fotos_extra        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perk_fotos_extra_hasta  timestamptz;

COMMENT ON COLUMN public.businesses.perk_borde_dorado_hasta IS
  'Concesión manual del marco y la corona dorada, al margen del plan. NULL = sin conceder.';
COMMENT ON COLUMN public.businesses.perk_promociones_hasta IS
  'Concesión manual del módulo de promociones, al margen del plan. NULL = sin conceder.';
COMMENT ON COLUMN public.businesses.perk_prioridad_hasta IS
  'Concesión manual de prioridad en el orden del directorio, al margen del plan. NULL = sin conceder.';
COMMENT ON COLUMN public.businesses.perk_fotos_extra IS
  'Fotos adicionales sobre el tope del plan. Sólo cuentan mientras perk_fotos_extra_hasta esté vigente.';
COMMENT ON COLUMN public.businesses.perk_fotos_extra_hasta IS
  'Hasta cuándo valen las fotos extra concedidas. NULL = sin conceder.';

-- ── 2. Protección: que el dueño no se las conceda solo ───────────────────
--
-- La política RLS de UPDATE es `auth.uid() = owner_id` sin restricción de
-- columnas, así que sin esto cualquier dueño podría regalarse el borde
-- dorado desde la consola del navegador. El trigger devuelve los valores
-- anteriores salvo que quien escribe sea admin.

CREATE OR REPLACE FUNCTION public.proteger_beneficios_sueltos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin boolean;
BEGIN
  -- El panel escribe con la service role key, que no tiene auth.uid().
  -- Ese caso pasa sin más: ya está autenticado como admin del lado servidor.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(is_admin, false) INTO v_es_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF COALESCE(v_es_admin, false) THEN
    RETURN NEW;
  END IF;

  NEW.perk_borde_dorado_hasta := OLD.perk_borde_dorado_hasta;
  NEW.perk_promociones_hasta  := OLD.perk_promociones_hasta;
  NEW.perk_prioridad_hasta    := OLD.perk_prioridad_hasta;
  NEW.perk_fotos_extra        := OLD.perk_fotos_extra;
  NEW.perk_fotos_extra_hasta  := OLD.perk_fotos_extra_hasta;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_proteger_perks ON public.businesses;
CREATE TRIGGER businesses_proteger_perks
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_beneficios_sueltos();

-- ── 3. Verificación ──────────────────────────────────────────────────────

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name LIKE 'perk_%'
ORDER BY column_name;
