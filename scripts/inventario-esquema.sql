-- ============================================================
-- INVENTARIO DEL ESQUEMA REAL — SOLO LECTURA
-- ============================================================
--
-- Para qué: el baseline de migraciones (ver docs/MIGRACIONES.md) necesita
-- saber cómo está la base de verdad, no cómo deberían haberla dejado los 64
-- scripts sueltos. Este script lo averigua sin sacar datos.
--
-- No escribe nada. No lee ni una fila de negocios, perfiles, reseñas o
-- mensajes: sólo consulta los catálogos de Postgres, que describen la forma
-- del esquema, no su contenido. Se puede correr contra producción sin riesgo.
--
-- Cómo usarlo:
--   1. Supabase → SQL Editor → New Query
--   2. Pegar todo esto y Run
--   3. Devuelve UNA sola celda de texto. Copiarla entera.
--
-- Lo que devuelve son nombres de tablas, columnas, tipos, funciones, triggers
-- y políticas RLS. Revisalo antes de compartirlo si tenés dudas: los nombres
-- de política a veces describen reglas de negocio.
--
-- ============================================================

WITH
-- ── Registro de migraciones de la CLI ───────────────────────────────────
-- Si esta tabla no existe, la CLI nunca corrió acá. Es justamente lo que
-- esperamos encontrar hoy.
migraciones AS (
  SELECT CASE
    WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL
      THEN '(la tabla no existe: la CLI nunca se usó contra esta base)'
    ELSE COALESCE(
      (SELECT string_agg(version, E'\n' ORDER BY version)
         FROM supabase_migrations.schema_migrations),
      '(la tabla existe pero está vacía)')
  END AS txt
),

-- ── Tablas y columnas ───────────────────────────────────────────────────
columnas AS (
  SELECT string_agg(linea, E'\n' ORDER BY tabla, orden) AS txt
  FROM (
    SELECT
      c.relname AS tabla,
      a.attnum  AS orden,
      '  ' || c.relname || '.' || a.attname
        || ' :: ' || format_type(a.atttypid, a.atttypmod)
        || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
        || COALESCE(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), '')
        AS linea
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND a.attnum > 0
      AND NOT a.attisdropped
  ) s
),

-- ── Restricciones (claves, únicos, checks) ──────────────────────────────
restricciones AS (
  SELECT string_agg('  ' || c.relname || ': ' || con.conname
                    || ' — ' || pg_get_constraintdef(con.oid),
                    E'\n' ORDER BY c.relname, con.conname) AS txt
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
),

-- ── Índices ─────────────────────────────────────────────────────────────
indices AS (
  SELECT string_agg('  ' || indexdef, E'\n' ORDER BY tablename, indexname) AS txt
  FROM pg_indexes
  WHERE schemaname = 'public'
),

-- ── Funciones ───────────────────────────────────────────────────────────
-- Sólo la firma. El cuerpo no hace falta para el baseline y puede ser largo.
funciones AS (
  SELECT string_agg('  ' || p.proname
                    || '(' || pg_get_function_arguments(p.oid) || ')'
                    || ' → ' || pg_get_function_result(p.oid),
                    E'\n' ORDER BY p.proname) AS txt
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
),

-- ── Triggers ────────────────────────────────────────────────────────────
triggers AS (
  SELECT string_agg('  ' || c.relname || ': ' || t.tgname, E'\n'
                    ORDER BY c.relname, t.tgname) AS txt
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
),

-- ── RLS: estado por tabla ───────────────────────────────────────────────
rls AS (
  SELECT string_agg('  ' || c.relname || ': '
                    || CASE WHEN c.relrowsecurity THEN 'RLS activo'
                            ELSE '*** RLS DESACTIVADO ***' END,
                    E'\n' ORDER BY c.relname) AS txt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),

-- ── RLS: políticas ──────────────────────────────────────────────────────
politicas AS (
  SELECT string_agg('  ' || tablename || ' [' || cmd || '] ' || policyname,
                    E'\n' ORDER BY tablename, policyname) AS txt
  FROM pg_policies
  WHERE schemaname = 'public'
),

-- ── Buckets de Storage ──────────────────────────────────────────────────
-- Importa que payment_receipts siga privado: contiene comprobantes de pago.
buckets AS (
  SELECT CASE
    WHEN to_regclass('storage.buckets') IS NULL THEN '(sin storage)'
    ELSE COALESCE(
      (SELECT string_agg('  ' || id || ' — '
                         || CASE WHEN public THEN '*** PÚBLICO ***'
                                 ELSE 'privado' END,
                         E'\n' ORDER BY id)
         FROM storage.buckets),
      '(sin buckets)')
  END AS txt
)

SELECT
     '===== INVENTARIO DE ESQUEMA — ' || now()::date || ' ====='
  || E'\n\n--- REGISTRO DE MIGRACIONES DE LA CLI ---\n'
  || COALESCE((SELECT txt FROM migraciones), '(nada)')
  || E'\n\n--- COLUMNAS ---\n'
  || COALESCE((SELECT txt FROM columnas), '(nada)')
  || E'\n\n--- RESTRICCIONES ---\n'
  || COALESCE((SELECT txt FROM restricciones), '(nada)')
  || E'\n\n--- ÍNDICES ---\n'
  || COALESCE((SELECT txt FROM indices), '(nada)')
  || E'\n\n--- FUNCIONES ---\n'
  || COALESCE((SELECT txt FROM funciones), '(nada)')
  || E'\n\n--- TRIGGERS ---\n'
  || COALESCE((SELECT txt FROM triggers), '(nada)')
  || E'\n\n--- RLS POR TABLA ---\n'
  || COALESCE((SELECT txt FROM rls), '(nada)')
  || E'\n\n--- POLÍTICAS RLS ---\n'
  || COALESCE((SELECT txt FROM politicas), '(nada)')
  || E'\n\n--- BUCKETS DE STORAGE ---\n'
  || COALESCE((SELECT txt FROM buckets), '(nada)')
  || E'\n\n===== FIN ====='
  AS inventario;
