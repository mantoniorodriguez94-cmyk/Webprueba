-- ============================================================
-- LIMPIEZA: columnas de borde dorado que sobran
-- ============================================================
--
-- La tabla `businesses` acumuló tres columnas para lo mismo, y dos de ellas
-- no las lee ni las escribe nadie:
--
--   has_gold_border      → VIVA. La escribe applyTierBenefitsToBusinesses
--                          (tier >= 3) y la muestra el panel de admin.
--                          NO se toca.
--   has_golden_border    → muerta. Cero referencias en el código. La creó
--                          scripts/add-has-golden-border-to-businesses.sql
--                          con DEFAULT true, por eso trae `true` en filas
--                          donde has_gold_border dice `false`: la
--                          contradicción que se veía era esto.
--   golden_border_active → muerta. Cero referencias en el código.
--
-- Vale aclarar qué pinta el borde de verdad, porque no es ninguna de las
-- tres: la tarjeta lo deriva del plan del dueño en tiempo de render
-- (BusinessFeedCard.tsx, `ownerTier >= 3`). Las columnas son espejos
-- informativos, no la fuente de verdad.
--
-- OJO: scripts/add-has-golden-border-to-businesses.sql sigue en el repo como
-- registro histórico. NO volver a ejecutarlo después de esto, o recrea la
-- columna que acá se elimina.

-- ── 1. Comprobación previa ───────────────────────────────────────────────
-- Deja ver los valores antes de borrarlos, por si algo llama la atención.

SELECT
  name,
  has_gold_border,
  has_golden_border,
  golden_border_active
FROM public.businesses;

-- ── 2. La limpieza ───────────────────────────────────────────────────────
-- Sin CASCADE a propósito: si alguna vista o índice dependiera de estas
-- columnas, se prefiere que falle acá y revisarlo, antes que arrastrar algo
-- por delante en silencio.

ALTER TABLE public.businesses DROP COLUMN IF EXISTS has_golden_border;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS golden_border_active;

-- ── 3. Verificación ──────────────────────────────────────────────────────
-- Debe quedar una sola fila: has_gold_border.

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name LIKE '%gold%';
