-- ============================================================
-- COLUMNAS QUE DEVUELVEN VALORES FALSOS
-- ============================================================
--
-- Tres columnas que ya no lee nadie pero siguen respondiendo, y lo que
-- responden no es verdad. Mientras estén ahí, el próximo que las encuentre
-- las creerá.
--
--   profiles.membership_tier    → 0 en las 9 filas
--   profiles.membership_expiry  → null en las 9 filas
--   businesses.max_photos       → 5 en las 4 filas
--
-- No es hipotético. `membership_tier` contradice a `subscription_tier` en 3
-- de las 9 cuentas: hay perfiles con Patrocina cuyo membership_tier dice 0.
-- Y `max_photos` ya causó un fallo real: el código hacía
-- `max_photos ?? escaleraPorPlan`, y como traía 5 —no null— ese 5 ganaba
-- siempre y la escalera 3/6/9/12 no se aplicó nunca.
--
-- membership_tier/membership_expiry son las predecesoras de
-- subscription_tier/subscription_end_date: scripts/migrate-to-subscriptions.sql
-- inicializó las nuevas a partir de las viejas y dejó las viejas en su sitio.
-- Desde entonces sólo las escribía... nada. Por eso se quedaron en cero.
--
-- ⚠ OJO: `premium_plans.max_photos` es OTRA columna, de otra tabla, y no se
-- toca. Acá sólo se quita la de `businesses`.
--
-- Se usa DROP COLUMN sin CASCADE a propósito: si alguna vista, índice o
-- restricción dependiera de estas columnas, Postgres aborta la migración en
-- vez de llevarse por delante lo que dependa. Preferimos enterarnos.

-- ── 1. Aviso previo: funciones que nombren estas columnas ────────────────
-- El cuerpo de una función no crea dependencia registrada, así que un
-- DROP no lo detectaría. Esto no bloquea nada; sólo deja el aviso en el log.

DO $$
DECLARE
  encontradas text;
BEGIN
  SELECT string_agg(p.proname, ', ')
    INTO encontradas
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND (p.prosrc ILIKE '%membership_tier%'
      OR p.prosrc ILIKE '%membership_expiry%'
      OR p.prosrc ILIKE '%businesses.max_photos%');

  IF encontradas IS NOT NULL THEN
    RAISE NOTICE 'Funciones que nombran estas columnas: %', encontradas;
  ELSE
    RAISE NOTICE 'Ninguna función nombra estas columnas.';
  END IF;
END
$$;

-- ── 2. Quitarlas ─────────────────────────────────────────────────────────

ALTER TABLE public.profiles   DROP COLUMN IF EXISTS membership_tier;
ALTER TABLE public.profiles   DROP COLUMN IF EXISTS membership_expiry;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS max_photos;

-- ── 3. Verificación ──────────────────────────────────────────────────────
-- No debe devolver ninguna fila.

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles'   AND column_name IN ('membership_tier', 'membership_expiry'))
    OR (table_name = 'businesses' AND column_name = 'max_photos')
  );
