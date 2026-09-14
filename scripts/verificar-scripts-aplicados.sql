-- ============================================================================
-- ¿Qué scripts están aplicados en ESTA base?
-- ============================================================================
-- Supabase no guarda un registro de qué SQL se corrió: el esquema se aplica a
-- mano en el editor, y eso no queda versionado en ningún lado. En vez de
-- buscar ese registro inexistente, esto pregunta por el ESTADO: si los objetos
-- que crea cada script están o no están.
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

    -- referral-rewards-table.sql
    (to_regclass('public.referral_rewards') is not null)                          as ref_tabla,
    (select count(*) from pg_constraint
       where conrelid = to_regclass('public.referral_rewards')
         and contype = 'u')                                                       as ref_unique,

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
  select 4, 'referral-rewards-table.sql',
    case when ref_tabla and ref_unique > 0 then '✅ aplicado' else '❌ FALTA' end,
    nullif(concat_ws(', ',
      case when not ref_tabla   then 'tabla referral_rewards'        end,
      case when ref_tabla and ref_unique = 0 then 'restricción unique en user_id' end
    ), ''),
    'Sin esto, "Otorgar mes gratis" se puede repetir sin límite'
  from objetos

  union all
  select 5, 'create-storage-bucket.sql',
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
-- Si la fila 5 sale en ⚠️, esto lo cierra:
--
--   update storage.buckets set public = false where id = 'payment_receipts';
--   drop policy if exists "Public receipts are viewable" on storage.objects;
--
-- Comprobar después que el panel sigue mostrando los comprobantes: la lectura
-- va por URL firmada y no debería verse afectada.
