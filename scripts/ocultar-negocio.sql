-- =============================================================
--  Ocultar un negocio del directorio
--  Ejecutar una sola vez en el SQL Editor de Supabase.
--  Es idempotente: se puede correr de nuevo sin romper nada.
--
--  El punto medio que faltaba entre no hacer nada y "Eliminar", que es
--  irreversible y se lleva reseñas, chat, fotos e historial de pagos.
--  Sirve para estafas, contenido que viola las reglas, negocios que cerraron
--  y reclamos de marca mientras se resuelven.
-- =============================================================


-- ── 1. Las columnas ─────────────────────────────────────────────────────────
-- Mismo patrón que las reseñas ocultas: cuándo, quién y por qué. El motivo no
-- es burocracia — es lo que se le responde al dueño cuando escriba, y lo que
-- queda en el registro de auditoría.

alter table public.businesses
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_by     uuid references auth.users(id) on delete set null,
  add column if not exists hidden_reason text;

create index if not exists idx_businesses_hidden
  on public.businesses(hidden_at)
  where hidden_at is not null;


-- ── 2. La política ──────────────────────────────────────────────────────────
-- Acá está lo importante, y por qué esto va en la base y no en el código.
--
-- Hay DIEZ consultas distintas que leen negocios para mostrarlos: el feed, la
-- ficha pública, el sitemap, la vitrina de la landing, el spotlight, el
-- carrusel de promociones y tres paneles laterales. Filtrar en cada una
-- significa que la número once —la que alguien escriba dentro de seis meses—
-- va a mostrar negocios ocultos, y nadie se va a dar cuenta hasta que pase.
--
-- Con una política, la base no los entrega. No hay consulta que pueda
-- olvidarse, ni las que todavía no existen.
--
-- RESTRICTIVE y no PERMISSIVE: en Postgres las permisivas se combinan con OR,
-- así que agregar una no restringiría nada — las políticas de lectura que ya
-- existen seguirían dejando pasar la fila. Las restrictivas se combinan con
-- AND: además de lo que ya se permita, la fila tiene que cumplir esto.
--
-- El dueño sigue viendo su propio negocio oculto. Tiene que poder entrar, ver
-- el aviso y corregir lo que se le señaló; esconderle su propia ficha lo
-- dejaría sin forma de arreglar nada.
--
-- El panel de administración no se ve afectado: opera con la service-role key,
-- que salta RLS por completo.

drop policy if exists "businesses_hide_from_public" on public.businesses;
create policy "businesses_hide_from_public"
  on public.businesses
  as restrictive
  for select
  using (
    hidden_at is null
    or owner_id = auth.uid()
  );


-- ── Comprobación ────────────────────────────────────────────────────────────
-- Después de ocultar un negocio desde el panel, esto debería devolver 0 filas
-- si lo corres como usuario anónimo, y la fila si eres su dueño:
--
--   select id, name, hidden_at from public.businesses where hidden_at is not null;
--
-- Y para ver todos los ocultos (desde el SQL Editor, que usa service role):
--
--   select id, name, hidden_at, hidden_reason from public.businesses
--   where hidden_at is not null order by hidden_at desc;
