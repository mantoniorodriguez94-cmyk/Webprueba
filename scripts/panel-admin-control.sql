-- =============================================================
--  Control administrativo: moderación, suspensión y auditoría
--
--  Ejecutar una sola vez en el SQL Editor de Supabase.
--  Es idempotente: se puede correr de nuevo sin romper nada.
--
--  Cubre lo que el panel no podía resolver:
--    1. Ocultar una reseña sin borrarla.
--    2. Suspender a una persona sin eliminar su cuenta.
--    3. Revertir un pago ya aprobado.
--    4. Dejar registro de quién hizo qué.
-- =============================================================


-- ── 1. Moderación de reseñas ────────────────────────────────────────────────
-- Ocultar en vez de borrar: una reseña retirada por error se restaura, y queda
-- constancia de quién la retiró y por qué. Borrarla no deja nada que revisar
-- si el autor reclama.

alter table public.reviews
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_by     uuid references auth.users(id) on delete set null,
  add column if not exists hidden_reason text;

create index if not exists idx_reviews_hidden
  on public.reviews(hidden_at)
  where hidden_at is not null;


-- ── 2. Suspensión de personas ───────────────────────────────────────────────
-- Hasta ahora la única acción sobre una persona problemática era eliminarla,
-- que es irreversible y se lleva por delante sus negocios y su historial.
-- Suspender es el punto medio: la cuenta sigue existiendo y se puede levantar.

alter table public.profiles
  add column if not exists suspended_at     timestamptz,
  add column if not exists suspended_reason text;

create index if not exists idx_profiles_suspended
  on public.profiles(suspended_at)
  where suspended_at is not null;


-- ── 3. Reversión de pagos ───────────────────────────────────────────────────
-- No se toca el check de `status` (queda en pending/approved/rejected): un pago
-- revertido vuelve a 'rejected' y estas columnas explican que antes estuvo
-- aprobado y por qué se deshizo. Así la reversión no se confunde con un
-- rechazo de entrada.

alter table public.manual_payment_submissions
  add column if not exists reverted_at     timestamptz,
  add column if not exists reverted_by     uuid references auth.users(id) on delete set null,
  add column if not exists reverted_reason text;


-- ── 4. Registro de auditoría ────────────────────────────────────────────────
-- Quién hizo qué, sobre qué, y cuándo. Con un solo administrador parece de
-- más; deja de serlo en cuanto entra una segunda persona, o cuando un cliente
-- pregunta por qué le suspendieron el negocio y hay que poder responder con
-- algo más que la memoria.

create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  -- Quién. Se guarda también el correo porque si la cuenta se borra, el
  -- registro tiene que seguir diciendo quién fue.
  admin_id     uuid references auth.users(id) on delete set null,
  admin_email  text,

  -- Qué. Verbo corto y estable: 'review.hide', 'user.suspend',
  -- 'payment.revert', 'business.delete'…
  accion       text not null,

  -- Sobre qué. Tipo libre ('review', 'profile', 'business', 'payment') más el
  -- id del objeto, sin clave foránea: el registro debe sobrevivir al borrado
  -- de aquello que describe.
  objeto_tipo  text,
  objeto_id    text,

  -- Contexto: motivo escrito por el admin, valores antes/después, lo que haga
  -- falta para entender la acción sin abrir otra pantalla.
  detalle      jsonb
);

create index if not exists idx_audit_created
  on public.admin_audit_log(created_at desc);

create index if not exists idx_audit_objeto
  on public.admin_audit_log(objeto_tipo, objeto_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Nadie escribe ni lee esta tabla desde el navegador. Las rutas del servidor
-- usan la service-role key, que salta RLS; sin políticas de lectura, un
-- usuario con sesión no puede consultarla aunque lo intente.
drop policy if exists "audit_no_client_access" on public.admin_audit_log;
create policy "audit_no_client_access"
  on public.admin_audit_log
  for select
  using (false);


-- ── Comprobación ────────────────────────────────────────────────────────────
-- Descomenta para verificar que quedó todo:
--
-- select 'reviews'   as tabla, column_name from information_schema.columns
--   where table_name = 'reviews' and column_name like 'hidden%'
-- union all
-- select 'profiles', column_name from information_schema.columns
--   where table_name = 'profiles' and column_name like 'suspended%'
-- union all
-- select 'pagos', column_name from information_schema.columns
--   where table_name = 'manual_payment_submissions' and column_name like 'reverted%'
-- union all
-- select 'auditoria', 'tabla creada' where to_regclass('public.admin_audit_log') is not null;
