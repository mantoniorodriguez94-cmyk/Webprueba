-- ============================================================
-- LÍMITE DE FOTOS POR PLAN — aplicado por la base de datos
-- ============================================================
--
-- La escalera es 3 / 6 / 9 / 12 (Básico / Conecta / Destaca / Patrocina) y
-- hasta ahora vivía sólo en el navegador: la galería contaba las fotos en
-- React y luego escribía gallery_urls con un UPDATE directo. La política RLS
-- sólo comprueba auth.uid() = owner_id, así que desde la consola se podía
-- mandar un array de cincuenta URLs y pasaba sin objeción.
--
-- Además la columna `max_photos` traía 5 en todas las filas y el código hacía
-- `max_photos ?? escaleraPorPlan`, de modo que ese 5 ganaba siempre y la
-- escalera nunca se aplicó. El código ya no la lee; acá se deja de usar
-- también del lado de la base.
--
-- El tier se lee del perfil del dueño y no de `businesses.is_premium`, que es
-- un espejo que puede quedar desactualizado. Una suscripción vencida cuenta
-- como Básico, igual que hace isTierActive en el front.

-- ── 1. Cómo se cuentan las fotos ─────────────────────────────────────────
--
-- `gallery_urls` es de tipo TEXT y guarda un array JSON serializado, no un
-- TEXT[] de Postgres. El script que creó la tabla la declaraba como TEXT[],
-- pero la columna viva no lo es —de ahí que el código TypeScript la parsee
-- con JSON.parse cuando llega como cadena—, así que array_length() no sirve.
--
-- Si el contenido no es un array JSON válido se devuelve 0. Es deliberado
-- que el caso raro sea permisivo y no restrictivo: un dato con formato
-- inesperado no debe dejar a nadie sin poder guardar su galería.

CREATE OR REPLACE FUNCTION public.contar_fotos(p_gallery text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_gallery IS NULL OR btrim(p_gallery) = '' THEN
    RETURN 0;
  END IF;
  IF jsonb_typeof(p_gallery::jsonb) <> 'array' THEN
    RETURN 0;
  END IF;
  RETURN jsonb_array_length(p_gallery::jsonb);
EXCEPTION WHEN others THEN
  RETURN 0;
END;
$$;

-- ── 2. Comprobación previa ───────────────────────────────────────────────
-- Negocios que hoy se pasarían del límite de su plan. Si aparece alguno, hay
-- que recortarle la galería antes de instalar el trigger, o sus dueños no
-- podrán volver a guardar cambios.

SELECT
  b.name,
  public.contar_fotos(b.gallery_urls) AS fotos_actuales,
  CASE
    WHEN p.subscription_tier IS NULL THEN 3
    WHEN p.subscription_end_date IS NOT NULL
         AND p.subscription_end_date <= now() THEN 3
    WHEN p.subscription_tier = 1 THEN 6
    WHEN p.subscription_tier = 2 THEN 9
    WHEN p.subscription_tier >= 3 THEN 12
    ELSE 3
  END AS permitidas
FROM public.businesses b
LEFT JOIN public.profiles p ON p.id = b.owner_id
WHERE public.contar_fotos(b.gallery_urls) >
  CASE
    WHEN p.subscription_tier IS NULL THEN 3
    WHEN p.subscription_end_date IS NOT NULL
         AND p.subscription_end_date <= now() THEN 3
    WHEN p.subscription_tier = 1 THEN 6
    WHEN p.subscription_tier = 2 THEN 9
    WHEN p.subscription_tier >= 3 THEN 12
    ELSE 3
  END;

-- ── 3. El candado ────────────────────────────────────────────────────────

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

  v_actuales := public.contar_fotos(NEW.gallery_urls);

  -- Quitar fotos siempre se permite: si no, alguien que baja de plan queda
  -- encerrado, sin poder guardar nada hasta recortar, pero sin poder recortar.
  IF TG_OP = 'UPDATE'
     AND v_actuales <= public.contar_fotos(OLD.gallery_urls) THEN
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
  -- Ver scripts/beneficios-sueltos.sql, que debe ejecutarse antes que este.
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

DROP TRIGGER IF EXISTS businesses_limite_fotos ON public.businesses;
CREATE TRIGGER businesses_limite_fotos
  BEFORE INSERT OR UPDATE OF gallery_urls, owner_id ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_limite_fotos();

-- ── 4. Verificación ──────────────────────────────────────────────────────

SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.businesses'::regclass
  AND NOT tgisinternal;
