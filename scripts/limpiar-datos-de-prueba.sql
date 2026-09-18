-- ============================================================
-- BORRAR LOS NEGOCIOS DE PRUEBA DE PRODUCCIÓN
-- ============================================================
--
-- La base de producción tiene cuatro negocios y los cuatro son de prueba:
-- "negocio 3", "omer prueba 1", "omer prueba 2", "Prueba 4", con categorías
-- como "ewfef" y "Hajja" y descripciones tecleadas al azar. No están ocultos:
-- sus fichas responden al público y el sitemap las anuncia a los buscadores.
--
-- ── LO QUE ESTE SCRIPT NO TOCA ──────────────────────────────────────────────
--
-- NO borra cuentas. Los nueve perfiles son personas reales, incluidas las
-- dueñas de estos negocios. Se quedan con su cuenta y su nivel; lo único que
-- pierden es el negocio de prueba, y con él se les libera el cupo (hay un
-- índice de un negocio por cuenta, así que sin esto no podrían crear el real).
--
-- NO borra el historial de cobros. `membership_payments` —18 filas, con pagos
-- de verdad— no cuelga de `businesses`, así que el borrado ni la roza.
--
-- ── LA TRAMPA QUE HAY QUE ESQUIVAR ──────────────────────────────────────────
--
-- `payments` y `manual_payment_submissions` SÍ cuelgan de `businesses`, y con
-- ON DELETE CASCADE. Es decir: un `delete from businesses` a secas se lleva
-- por delante filas de pago sin decir nada. Por eso el PASO 2 las desengancha
-- antes, en vez de confiar en que "seguro que no había ninguna".
--
-- El resto de las dependencias sí pueden cascadear tranquilas, porque son
-- datos del negocio y mueren con él: reviews (y sus review_reports),
-- conversations (y sus messages), promotions, business_views, business_saves,
-- business_interactions, business_claims y business_reports.
--
-- No hay archivos que limpiar en Storage: los cuatro tienen logo_url y
-- gallery_urls en null, así que no subieron ninguna imagen.
--
-- ── CÓMO USARLO ─────────────────────────────────────────────────────────────
--
-- En el SQL Editor de Supabase. Primero el PASO 1 SOLO, y se lee el resultado.
-- Si lo que sale es lo esperado, se corren los PASOS 2, 3 y 4 juntos.
--
-- Si algún día cambia el conjunto a borrar, hay que cambiar la lista de
-- identificadores en los CINCO sitios donde aparece: los dos del PASO 1, los
-- dos del PASO 2 y el del PASO 3. Está repetida a propósito: en un script que
-- borra, se prefiere verla entera cada vez a esconderla en una variable que
-- haya que ir a buscar a otra parte del archivo.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PASO 1 — MIRAR. No borra nada. Correr esto solo, y leerlo.
-- ════════════════════════════════════════════════════════════

-- 1a. Los negocios que se van a borrar.
select
  b.id,
  b.name          as nombre,
  b.category      as categoria,
  b.created_at    as creado,
  p.email         as dueno
from public.businesses b
left join public.profiles p on p.id = b.owner_id
where b.id in (
  '8fa7a9e1-4fdf-4d23-9ae1-5197d733d78a',  -- negocio 3
  '52ea23b7-bdb0-4395-a101-563d27d57bde',  -- omer prueba 2
  'dc3face1-c383-4de4-b6a4-8eb54ccc40db',  -- Prueba 4
  '6b6117a3-e1b6-4488-81fa-7a811b1aceb5'   -- omer prueba 1
)
order by b.created_at;

-- 1b. Qué se lleva por delante el borrado, tabla por tabla.
--     Las dos últimas filas son las que importan: si traen algo distinto de
--     cero, hay filas de PAGO enganchadas a estos negocios y el PASO 2 tiene
--     que desengancharlas antes.
with objetivo(id) as (
  values
    ('8fa7a9e1-4fdf-4d23-9ae1-5197d733d78a'::uuid),
    ('52ea23b7-bdb0-4395-a101-563d27d57bde'::uuid),
    ('dc3face1-c383-4de4-b6a4-8eb54ccc40db'::uuid),
    ('6b6117a3-e1b6-4488-81fa-7a811b1aceb5'::uuid)
)
select 'reviews'                    as tabla, count(*) as filas from public.reviews                where business_id in (select id from objetivo)
union all
select 'conversations',                       count(*)          from public.conversations          where business_id in (select id from objetivo)
union all
select 'messages (de esas conv.)',            count(*)          from public.messages               where conversation_id in (select id from public.conversations where business_id in (select id from objetivo))
union all
select 'promotions',                          count(*)          from public.promotions             where business_id in (select id from objetivo)
union all
select 'business_views',                      count(*)          from public.business_views         where business_id in (select id from objetivo)
union all
select 'business_saves',                      count(*)          from public.business_saves         where business_id in (select id from objetivo)
union all
select 'business_claims',                     count(*)          from public.business_claims        where business_id in (select id from objetivo)
union all
select 'business_reports',                    count(*)          from public.business_reports       where business_id in (select id from objetivo)
union all
select '⚠ payments',                          count(*)          from public.payments               where business_id in (select id from objetivo)
union all
select '⚠ manual_payment_submissions',        count(*)          from public.manual_payment_submissions where business_id in (select id from objetivo);


-- ════════════════════════════════════════════════════════════
-- PASO 2, 3 y 4 — BORRAR. Correr los tres juntos.
-- ════════════════════════════════════════════════════════════

begin;

-- ── PASO 2. Desenganchar los pagos ─────────────────────────────────────────
-- Se les quita la referencia al negocio para que el cascade no se los lleve.
-- La fila de pago sobrevive sin negocio: eso es correcto, porque el pago lo
-- hizo una CUENTA y el nivel vive en `profiles`, no en el negocio.
--
-- Si esto falla con "null value violates not-null constraint", significa que
-- en esta base `business_id` todavía es obligatorio. Entonces hay que decidir
-- a mano qué hacer con esas filas —si también son de prueba, se borran ellas
-- primero— pero NO seguir adelante y dejar que cascadeen sin mirarlas.

update public.manual_payment_submissions
set business_id = null
where business_id in (
  '8fa7a9e1-4fdf-4d23-9ae1-5197d733d78a',
  '52ea23b7-bdb0-4395-a101-563d27d57bde',
  'dc3face1-c383-4de4-b6a4-8eb54ccc40db',
  '6b6117a3-e1b6-4488-81fa-7a811b1aceb5'
);

update public.payments
set business_id = null
where business_id in (
  '8fa7a9e1-4fdf-4d23-9ae1-5197d733d78a',
  '52ea23b7-bdb0-4395-a101-563d27d57bde',
  'dc3face1-c383-4de4-b6a4-8eb54ccc40db',
  '6b6117a3-e1b6-4488-81fa-7a811b1aceb5'
);

-- ── PASO 3. Borrar los negocios ────────────────────────────────────────────
-- Todo lo demás se va solo por las claves foráneas en cascada.
-- El `returning` deja constancia en la salida de qué se borró exactamente.

delete from public.businesses
where id in (
  '8fa7a9e1-4fdf-4d23-9ae1-5197d733d78a',
  '52ea23b7-bdb0-4395-a101-563d27d57bde',
  'dc3face1-c383-4de4-b6a4-8eb54ccc40db',
  '6b6117a3-e1b6-4488-81fa-7a811b1aceb5'
)
returning id, name as nombre_borrado;

commit;


-- ── PASO 4. Verificar ──────────────────────────────────────────────────────
-- Lo que TIENE que salir:
--   negocios_restantes          → 0
--   perfiles                    → 9   (nadie perdió su cuenta)
--   membership_payments         → 18  (el historial de cobros, intacto)
--   huerfanos_*                 → 0   (no quedó nada colgando)

select
  (select count(*) from public.businesses)                                   as negocios_restantes,
  (select count(*) from public.profiles)                                     as perfiles,
  (select count(*) from public.membership_payments)                          as membership_payments,
  (select count(*) from public.reviews r
     where not exists (select 1 from public.businesses b where b.id = r.business_id))       as huerfanos_reviews,
  (select count(*) from public.conversations c
     where not exists (select 1 from public.businesses b where b.id = c.business_id))       as huerfanos_conversations,
  (select count(*) from public.messages m
     where not exists (select 1 from public.conversations c where c.id = m.conversation_id)) as huerfanos_messages;
