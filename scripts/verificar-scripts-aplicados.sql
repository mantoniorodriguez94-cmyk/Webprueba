-- ============================================================================
-- ¿Qué scripts están aplicados en ESTA base?
-- ============================================================================
-- La base tiene dos mitades con reglas distintas:
--
--   supabase/migrations/  va numerado y en orden. Deja registro en
--                         supabase_migrations.schema_migrations SOLO si se
--                         aplica con el CLI; pegado a mano, no.
--   scripts/              se pega a mano en el editor y no deja ninguno.
--
-- Esto cubre la segunda mitad, que es la que no se puede auditar de otra
-- forma: en vez de buscar un registro que no existe, pregunta por el ESTADO
-- —si los objetos que crea cada script están o no están— y de paso lista las
-- migraciones que sí constan.
--
-- Pegar entero en el SQL Editor de Supabase y ejecutar. Solo lee; no modifica
-- nada. Una fila por script, con lo que falta cuando falta.
-- ============================================================================

with objetos as (
  select
    -- panel-admin-control.sql
    (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'reviews'
         and column_name in ('hidden_at','hidden_by','hidden_reason'))            as rev_cols,
    (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'
         and column_name in ('suspended_at','suspended_reason'))                  as prof_cols,
    (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'manual_payment_submissions'
         and column_name in ('reverted_at','reverted_by','reverted_reason'))      as pago_cols,
    (to_regclass('public.admin_audit_log') is not null)                           as audit_tabla,

    -- ocultar-negocio.sql
    (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'businesses'
         and column_name in ('hidden_at','hidden_by','hidden_reason'))            as neg_cols,
    (select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'businesses'
         and policyname = 'businesses_hide_from_public')                          as neg_policy,

    -- support-table.sql
    (to_regclass('public.support_messages') is not null)                          as soporte_tabla,

    -- create-storage-bucket.sql
    (select count(*) from storage.buckets where id = 'payment_receipts')          as bucket,
    (select bool_or(public) from storage.buckets where id = 'payment_receipts')   as bucket_publico
)
select * from (
  select
    1 as orden,
    'panel-admin-control.sql' as script,
    case when rev_cols = 3 and prof_cols = 2 and pago_cols = 3 and audit_tabla
         then '✅ aplicado' else '❌ FALTA' end as estado,
    nullif(concat_ws(', ',
      case when rev_cols  < 3      then 'reviews.hidden_*'                  end,
      case when prof_cols < 2      then 'profiles.suspended_*'              end,
      case when pago_cols < 3      then 'manual_payment_submissions.reverted_*' end,
      case when not audit_tabla    then 'tabla admin_audit_log'             end
    ), '') as que_falta,
    'Auditoría, suspender cuentas, ocultar reseñas, revertir pagos' as sin_esto_no_anda
  from objetos

  union all
  select 2, 'ocultar-negocio.sql',
    case when neg_cols = 3 and neg_policy = 1 then '✅ aplicado' else '❌ FALTA' end,
    nullif(concat_ws(', ',
      case when neg_cols   < 3 then 'businesses.hidden_*'                     end,
      case when neg_policy = 0 then 'política businesses_hide_from_public'    end
    ), ''),
    'Ocultar un negocio del directorio'
  from objetos

  union all
  select 3, 'support-table.sql',
    case when soporte_tabla then '✅ aplicado' else '❌ FALTA' end,
    case when soporte_tabla then null else 'tabla support_messages' end,
    'Bandeja de soporte en el panel'
  from objetos

  union all
  select 4, 'create-storage-bucket.sql',
    case
      when bucket = 0        then '❌ FALTA'
      when bucket_publico    then '⚠️ APLICADO PERO PÚBLICO'
      else '✅ aplicado y privado'
    end,
    case
      when bucket = 0     then 'bucket payment_receipts'
      when bucket_publico then 'El bucket es PÚBLICO: los comprobantes de pago se '
                               || 'leen sin autenticación. Ver nota al final.'
      else null
    end,
    'Comprobantes de pagos manuales'
  from objetos
) f
order by orden;


-- ── Nota sobre el bucket ────────────────────────────────────────────────────
-- create-storage-bucket.sql lo crea con public = true y le agrega una política
-- de lectura para el rol `public`. Eso contradice al README, que exige que sea
-- privado, y con razón: son capturas de transferencias con nombres y números
-- de cuenta. El panel ya las muestra con URLs firmadas de una hora
-- (createSignedUrl), así que NO necesita que el bucket sea público.
--
-- Si la fila 4 sale en ⚠️, esto lo cierra:
--
--   update storage.buckets set public = false where id = 'payment_receipts';
--   drop policy if exists "Public receipts are viewable" on storage.objects;
--
-- Comprobar después que el panel sigue mostrando los comprobantes: la lectura
-- va por URL firmada y no debería verse afectada.


-- ── Las migraciones que sí dejan registro ───────────────────────────────────
-- Si el proyecto está enlazado con el CLI, esto las cuenta y no hace falta
-- deducir nada. Si la tabla NO existe, significa que nunca se corrió
-- `supabase db push` — pero OJO: no prueba que las migraciones falten, porque
-- pegadas a mano en el editor se aplican sin dejar registro. En ese caso hay
-- que mirar el efecto de cada una en el esquema, no el registro.

select
  case
    when to_regclass('supabase_migrations.schema_migrations') is null
      then '⚠️ sin registro — CLI no enlazado (no dice si faltan o no)'
    else '✅ ' || (select count(*)::text from supabase_migrations.schema_migrations)
         || ' migraciones aplicadas'
  end as migraciones;

-- Y cuáles, por si falta alguna suelta:
--
--   select version, name from supabase_migrations.schema_migrations
--   order by version;


-- ── Y si no hay registro: el efecto de cada migración ───────────────────────
-- Sin el CLI enlazado la tabla de arriba no dice nada, así que esto pregunta
-- por lo que cada migración deja en el esquema. Es la misma idea que el primer
-- bloque, aplicada a supabase/migrations/.

select * from (
  select 1 as n, 'un_negocio_por_cuenta' as migracion,
    case when exists (select 1 from pg_indexes where schemaname = 'public'
                        and indexname = 'businesses_un_negocio_por_cuenta')
         then '✅' else '❌ FALTA' end as estado,
    'Índice único: una cuenta, un negocio' as efecto

  union all select 2, 'beneficios_sueltos',
    case when (select count(*) from information_schema.columns
                 where table_schema='public' and table_name='businesses'
                   and column_name like 'perk\_%') >= 5
         then '✅' else '❌ FALTA' end,
    'businesses.perk_* — concesiones manuales con vencimiento'

  union all select 3, 'limite_fotos_por_plan',
    case when exists (select 1 from pg_trigger
                        where tgname = 'businesses_limite_fotos')
         then '✅' else '❌ FALTA' end,
    'Trigger que aplica el límite de fotos en la base'

  union all select 4, 'limpiar_columnas_borde_dorado',
    case when not exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='businesses'
                              and column_name in ('has_golden_border','golden_border_active'))
         then '✅' else '❌ FALTA' end,
    'Fuera las dos columnas de borde dorado que nadie leía'

  union all select 5, 'gallery_urls_a_array',
    case (select data_type from information_schema.columns
            where table_schema='public' and table_name='businesses'
              and column_name='gallery_urls')
      when 'ARRAY' then '✅'
      when 'text'  then '❌ FALTA — sigue siendo TEXT'
      else '⚠️ no se pudo determinar' end,
    'gallery_urls: TEXT con JSON dentro → TEXT[] de verdad'

  union all select 6, 'resenas_cliente_verificado',
    case when exists (select 1 from information_schema.columns
                        where table_schema='public' and table_name='reviews'
                          and column_name='cliente_verificado')
         then '✅' else '❌ FALTA' end,
    'reviews.cliente_verificado y su trigger'

  union all select 7, 'resenas_solo_negocios_reclamados',
    case when exists (select 1 from pg_policies where schemaname='public'
                        and tablename='reviews'
                        and policyname='Users can create own reviews')
         then '✅' else '❌ FALTA' end,
    'Sólo se reseñan negocios con dueño'

  union all select 8, 'chat_tiempo_real',
    case when exists (select 1 from pg_trigger
                        where tgname = 'trigger_increment_unread_count')
         then '✅' else '❌ FALTA' end,
    'Triggers de no leídos y de marca de tiempo'

  union all select 9, 'columnas_muertas',
    case when not exists (select 1 from information_schema.columns
                            where table_schema='public'
                              and ((table_name='profiles'   and column_name in ('membership_tier','membership_expiry'))
                                or (table_name='businesses' and column_name='max_photos')))
         then '✅' else '❌ FALTA' end,
    'Fuera tres columnas que devolvían valores falsos'
) m order by n;
