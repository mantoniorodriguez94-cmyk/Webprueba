-- ============================================================
-- gallery_urls: de TEXT con JSON dentro a TEXT[] de verdad
-- ============================================================
--
-- create-businesses-table.sql siempre declaró `gallery_urls TEXT[]`, pero la
-- columna viva es TEXT y guarda un array JSON serializado. La discrepancia
-- costaba tres cosas:
--
--   1. El script de creación describía algo que no existe.
--   2. El código llevaba en tres archivos un `Array.isArray(x) ? x :
--      JSON.parse(x)` donde una de las dos ramas era la real y nadie sabía
--      cuál — el tipo de código que sobrevive años sin que nadie lo toque.
--   3. Postgres no podía contar ni indexar el contenido. El trigger del
--      límite de fotos necesitó una función contar_fotos() propia sólo para
--      saber cuántos elementos había.
--
-- Se hace ahora porque hoy no hay una sola galería cargada: la conversión no
-- puede perder nada. Con cientos de negocios con fotos, esto mismo sería una
-- migración de datos con riesgo.

-- ── 1. Comprobación previa ───────────────────────────────────────────────
-- Cuántas filas tienen contenido, y si alguna no es un array JSON válido.
-- Si aparece algo en 'no_convertible', hay que revisarlo a mano antes.

SELECT
  count(*) FILTER (WHERE gallery_urls IS NOT NULL
                     AND btrim(gallery_urls) <> '')             AS con_contenido,
  count(*) FILTER (WHERE gallery_urls IS NOT NULL
                     AND btrim(gallery_urls) <> ''
                     AND public.contar_fotos(gallery_urls) = 0) AS no_convertible
FROM public.businesses;

-- ── 2. La conversión ─────────────────────────────────────────────────────
-- El trigger del límite de fotos se declara con `UPDATE OF gallery_urls`, lo
-- que crea una dependencia sobre la columna y Postgres se niega a cambiarle
-- el tipo mientras exista (0A000). Se retira acá y se vuelve a crear en el
-- paso 3, ya adaptado al array.

DROP TRIGGER IF EXISTS businesses_limite_fotos ON public.businesses;

-- La traducción va en una función y no escrita dentro del USING porque
-- Postgres no admite subconsultas ahí (0A000), y desgranar un array JSON
-- requiere una. Dentro de una función sí se puede, y el USING sólo la llama.

CREATE OR REPLACE FUNCTION public.json_a_text_array(p text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p IS NULL OR btrim(p) = '' THEN
    RETURN NULL;
  END IF;
  RETURN ARRAY(SELECT jsonb_array_elements_text(p::jsonb));
END;
$$;

ALTER TABLE public.businesses
  ALTER COLUMN gallery_urls TYPE text[]
  USING public.json_a_text_array(gallery_urls);

-- Ya cumplió su único propósito.
DROP FUNCTION IF EXISTS public.json_a_text_array(text);

-- ── 3. El trigger vuelve a lo simple ─────────────────────────────────────
-- Con un array de verdad, array_length() basta y contar_fotos() sobra.

CREATE OR REPLACE FUNCTION public.validar_limite_fotos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier int;
  v_fin timestamptz;
  v_permitidas int;
  v_actuales int;
BEGIN
  -- Los negocios sin dueño los crea un admin para que alguien los reclame.
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_actuales := COALESCE(array_length(NEW.gallery_urls, 1), 0);

  -- Quitar fotos siempre se permite: si no, alguien que baja de plan queda
  -- encerrado, sin poder guardar nada hasta recortar, pero sin poder recortar.
  IF TG_OP = 'UPDATE'
     AND v_actuales <= COALESCE(array_length(OLD.gallery_urls, 1), 0) THEN
    RETURN NEW;
  END IF;

  SELECT subscription_tier, subscription_end_date
    INTO v_tier, v_fin
  FROM public.profiles
  WHERE id = NEW.owner_id;

  IF v_tier IS NULL OR v_tier <= 0
     OR (v_fin IS NOT NULL AND v_fin <= now()) THEN
    v_tier := 0;
  END IF;

  v_permitidas := CASE v_tier
    WHEN 1 THEN 6
    WHEN 2 THEN 9
    WHEN 3 THEN 12
    ELSE 3
  END;

  -- Fotos extra concedidas a mano desde el panel, mientras estén vigentes.
  IF NEW.perk_fotos_extra_hasta IS NOT NULL
     AND NEW.perk_fotos_extra_hasta > now() THEN
    v_permitidas := v_permitidas + COALESCE(NEW.perk_fotos_extra, 0);
  END IF;

  IF v_actuales > v_permitidas THEN
    RAISE EXCEPTION
      'Tu plan permite % fotos y se intentaron guardar %.', v_permitidas, v_actuales
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_limite_fotos
  BEFORE INSERT OR UPDATE OF gallery_urls, owner_id ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_limite_fotos();

DROP FUNCTION IF EXISTS public.contar_fotos(text);

-- ── 4. Verificación ──────────────────────────────────────────────────────
-- Debe decir ARRAY, y contar_fotos ya no debe existir.

SELECT data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'gallery_urls';

SELECT count(*) AS contar_fotos_restantes
FROM pg_proc
WHERE proname = 'contar_fotos';
