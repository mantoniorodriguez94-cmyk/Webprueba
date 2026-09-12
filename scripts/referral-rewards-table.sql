-- =============================================================
--  Recompensas de referidos
--  Ejecutar una sola vez en el SQL Editor de Supabase.
--  Es idempotente: se puede correr de nuevo sin romper nada.
--
--  El código la usa desde hace tiempo (award y list de referidos) pero nunca
--  existió un script que la creara. Sin la tabla, "Otorgar mes gratis" extiende
--  el premium igual pero no deja constancia — así que se le puede dar el mes
--  gratis a la misma persona tantas veces como se pulse el botón.
-- =============================================================

create table if not exists public.referral_rewards (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Una recompensa por persona. La restricción vive en la base y no sólo en
  -- la interfaz: el botón se puede pulsar dos veces, dos pestañas pueden
  -- pedirlo a la vez, y el premium ya se habría extendido antes de que nadie
  -- se diera cuenta.
  user_id    uuid not null unique references auth.users(id) on delete cascade
);

create index if not exists idx_referral_rewards_user
  on public.referral_rewards(user_id);

alter table public.referral_rewards enable row level security;

-- Sólo el servidor la toca, con la service-role key (que salta RLS). Sin
-- políticas de lectura, nadie puede consultarla desde el navegador.
drop policy if exists "referral_rewards_no_client_access" on public.referral_rewards;
create policy "referral_rewards_no_client_access"
  on public.referral_rewards
  for select
  using (false);
