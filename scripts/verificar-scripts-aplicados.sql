-- ============================================================================
-- ¿Qué scripts están aplicados en ESTA base?
-- ============================================================================
-- La base tiene dos mitades con reglas distintas:
--
--   supabase/migrations/  se aplica con el CLI y SÍ deja registro, en la tabla
--                         supabase_migrations.schema_migrations.
--   scripts/              se pega a mano en el editor y NO deja ninguno.
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
-- Estas no hace falta deducirlas: el CLI las anota. Si la tabla no existe, es
-- que nunca se corrió `supabase db push` contra esta base y ninguna de las
-- nueve migraciones de supabase/migrations/ está aplicada.

select
  case
    when to_regclass('supabase_migrations.schema_migrations') is null
      then '❌ sin registro de migraciones — ninguna aplicada'
    else '✅ ' || (select count(*)::text from supabase_migrations.schema_migrations)
         || ' migraciones aplicadas'
  end as migraciones;

-- Y cuáles, por si falta alguna suelta:
--
--   select version, name from supabase_migrations.schema_migrations
--   order by version;
