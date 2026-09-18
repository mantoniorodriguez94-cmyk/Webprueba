-- ============================================================
-- QUE SUSPENDER UNA CUENTA SIRVA DE ALGO
-- ============================================================
--
-- Hasta ahora "Suspender" escribía profiles.suspended_at y suspended_reason, y
-- nadie leía esas columnas fuera del propio panel. La persona suspendida
-- entraba y seguía operando exactamente igual: podía escribir reseñas, mandar
-- mensajes, publicar promociones. La moderación era decorativa — y encima el
-- panel mostraba "Cuenta suspendida el ...", así que desde dentro parecía
-- resuelto.
--
-- ── QUÉ SIGNIFICA SUSPENDER ────────────────────────────────────────────────
--
-- Es el punto medio entre no hacer nada y borrar la cuenta, y así está escrito
-- en la ruta que la concede: para quien "escribió una reseña abusiva o mandó
-- spam por chat". Así que corta lo que esa persona PRODUCE, no su acceso:
--
--   NO puede   escribir o editar reseñas, mandar mensajes, abrir
--              conversaciones, crear o editar negocios, publicar promociones,
--              ni levantar reportes.
--   SÍ puede   entrar, mirar el directorio, ver sus datos, y sobre todo
--              ESCRIBIR A SOPORTE — que es como reclama. Cerrarle también esa
--              puerta convertiría una suspensión discutible en definitiva.
--
-- ── POR QUÉ EN LA BASE Y NO EN EL CÓDIGO ───────────────────────────────────
--
-- Mismo criterio que scripts/ocultar-negocio.sql: hay muchas pantallas que
-- escriben, y comprobar la suspensión en cada una garantiza que la próxima que
-- se escriba se olvide. Una política restrictiva se aplica a todas a la vez,
-- incluidas las que todavía no existen.
--
-- ⚠ OJO con la service role: SALTA RLS por completo. Estas políticas NO
-- protegen las rutas que la usan. La única que importa es
-- /api/chat/create-conversation, que no es de admin y escribe con ella — ahí
-- la comprobación va en el código de la ruta, a mano. Las demás rutas con
-- service role son de admin y una persona suspendida no las alcanza.
-- ============================================================

-- ── 1. Quién está suspendido ───────────────────────────────────────────────
-- SECURITY DEFINER para poder leer profiles aunque sus propias políticas no
-- dejen. Devuelve false si no encuentra la fila: ante la duda, NO se castiga.

create or replace function public.esta_suspendido(id_usuario uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select suspended_at is not null from public.profiles where id = id_usuario),
    false
  );
$$;

comment on function public.esta_suspendido(uuid) is
  'true si la cuenta tiene suspended_at. La usan las políticas restrictivas de suspensión.';

-- ── 2. El candado ──────────────────────────────────────────────────────────
-- RESTRICTIVE se suma a las políticas que ya existan: no concede nada, sólo
-- quita. Las reglas de "cada quien toca lo suyo" siguen intactas; esto se
-- aplica ENCIMA.

-- Reseñas: el caso que motivó la función.
drop policy if exists "suspendido_no_escribe_resenas" on public.reviews;
create policy "suspendido_no_escribe_resenas" on public.reviews
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

drop policy if exists "suspendido_no_edita_resenas" on public.reviews;
create policy "suspendido_no_edita_resenas" on public.reviews
  as restrictive for update to authenticated
  using (not public.esta_suspendido(auth.uid()))
  with check (not public.esta_suspendido(auth.uid()));

-- Chat: el otro caso que motivó la función.
drop policy if exists "suspendido_no_manda_mensajes" on public.messages;
create policy "suspendido_no_manda_mensajes" on public.messages
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

drop policy if exists "suspendido_no_abre_conversaciones" on public.conversations;
create policy "suspendido_no_abre_conversaciones" on public.conversations
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

-- Negocios: ni crear ni editar. Los que ya tenga siguen publicados; para
-- quitarlos de la vista está "Ocultar negocio", que es otra acción y a
-- propósito: suspender a la persona no es lo mismo que castigar a su negocio.
drop policy if exists "suspendido_no_crea_negocios" on public.businesses;
create policy "suspendido_no_crea_negocios" on public.businesses
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

drop policy if exists "suspendido_no_edita_negocios" on public.businesses;
create policy "suspendido_no_edita_negocios" on public.businesses
  as restrictive for update to authenticated
  using (not public.esta_suspendido(auth.uid()))
  with check (not public.esta_suspendido(auth.uid()));

-- Promociones.
drop policy if exists "suspendido_no_crea_promociones" on public.promotions;
create policy "suspendido_no_crea_promociones" on public.promotions
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

drop policy if exists "suspendido_no_edita_promociones" on public.promotions;
create policy "suspendido_no_edita_promociones" on public.promotions
  as restrictive for update to authenticated
  using (not public.esta_suspendido(auth.uid()))
  with check (not public.esta_suspendido(auth.uid()));

-- Reportes: quien está suspendido por abusar del sistema no debería poder
-- seguir usándolo para hostigar denunciando a otros.
drop policy if exists "suspendido_no_reporta_negocios" on public.business_reports;
create policy "suspendido_no_reporta_negocios" on public.business_reports
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

drop policy if exists "suspendido_no_reporta_resenas" on public.review_reports;
create policy "suspendido_no_reporta_resenas" on public.review_reports
  as restrictive for insert to authenticated
  with check (not public.esta_suspendido(auth.uid()));

-- ── 3. Verificación ────────────────────────────────────────────────────────
--
-- 3a. RLS ACTIVADO en cada tabla. Esto va primero porque es el fallo
--     silencioso: una política restrictiva sobre una tabla con RLS apagado no
--     da error, no aparece rota, y simplemente no se aplica nunca. La columna
--     `rls_activado` tiene que ser true en las siete.

select
  c.relname                                     as tabla,
  c.relrowsecurity                              as rls_activado,
  count(p.policyname) filter (
    where p.policyname like 'suspendido_%'
  )                                             as politicas_de_suspension
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in (
    'reviews', 'messages', 'conversations', 'businesses',
    'promotions', 'business_reports', 'review_reports'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

-- 3b. Las políticas, una a una. Deben salir 10 y todas RESTRICTIVE.

select tablename, policyname, permissive, cmd
from pg_policies
where schemaname = 'public'
  and policyname like 'suspendido_%'
order by tablename, policyname;

-- 3c. La función responde. Con una cuenta cualquiera debe dar false, y con una
--     suspendida, true. Sustituye el identificador por uno real para probarlo.
--
-- select email, suspended_at is not null as marcada, public.esta_suspendido(id) as detectada
-- from public.profiles
-- order by suspended_at nulls last
-- limit 5;
