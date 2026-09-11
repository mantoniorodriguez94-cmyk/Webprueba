-- =============================================================
--  Tabla de mensajes de soporte
--  Ejecutar una sola vez en el SQL Editor de Supabase.
--  Es idempotente: se puede correr de nuevo sin romper nada.
-- =============================================================

create table if not exists public.support_messages (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Puede escribir alguien sin sesión, así que el usuario es opcional.
  user_id       uuid references auth.users(id) on delete set null,

  name          text not null,
  email         text not null,
  subject       text not null,
  message       text not null,

  -- Contexto útil para responder sin tener que preguntar.
  plan_tier     smallint,

  status        text not null default 'pending'
                check (status in ('pending', 'in_progress', 'resolved')),
  admin_notes   text,
  resolved_at   timestamptz
);

create index if not exists idx_support_status_created
  on public.support_messages(status, created_at desc);

alter table public.support_messages enable row level security;

-- Cualquiera puede ENVIAR un mensaje de soporte, con o sin sesión: si alguien
-- no puede entrar a su cuenta, igual tiene que poder pedir ayuda.
drop policy if exists "support_insert_any" on public.support_messages;
create policy "support_insert_any"
  on public.support_messages for insert
  with check (true);

-- Nadie lee desde el cliente. El panel de administración consulta con la
-- service role key, que no pasa por estas políticas. Sin esto, un usuario
-- podría leer los mensajes de soporte de otros.
drop policy if exists "support_no_client_read" on public.support_messages;
create policy "support_no_client_read"
  on public.support_messages for select
  using (false);
