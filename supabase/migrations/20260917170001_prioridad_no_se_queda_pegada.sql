-- ============================================================
-- LA PRIORIDAD EN EL BUSCADOR DEJA DE QUEDARSE PEGADA
-- ============================================================
--
-- `businesses.search_priority_boost` es un booleano SIN fecha al lado. Las
-- otras banderas espejo sí la tienen —is_premium/premium_until,
-- is_featured/featured_until— y por eso caducan solas al leerlas: la app
-- comprueba la fecha en vez de fiarse del booleano (ver banderaVigente() en
-- src/lib/memberships/perks.ts).
--
-- Ésta no podía. Se encendía al comprar el plan Destaca y no la apagaba nunca
-- nadie, así que quien pagaba UN mes conservaba el primer puesto del
-- directorio para siempre. Justo el beneficio que ese plan vende.
--
-- El arreglo no es un cron que barra banderas rancias, es que el plan deje de
-- escribir un espejo que nadie refresca. `tienePrioridad()` ya concede la
-- prioridad con `tierVigente >= 2`, y el tier se calcula en vivo desde el
-- perfil del dueño, que el feed trae en cada carga. Eso ya está hecho en
-- src/lib/memberships/service.ts.
--
-- A partir de ahora la columna significa UNA sola cosa: concesión manual de un
-- administrador, indefinida y a propósito. Los paneles de admin la siguen
-- escribiendo con ese sentido y no se tocan.
--
-- Queda limpiar lo que el plan dejó encendido antes del cambio.
-- ============================================================

-- ── 1. Antes de tocar nada: ver qué hay ────────────────────────────────────
-- Correr esto primero y leerlo.

select
  b.id,
  b.name                                            as negocio,
  coalesce(p.subscription_tier, 0)                  as tier_dueno,
  p.subscription_end_date                           as vence,
  case
    when coalesce(p.subscription_tier, 0) >= 2
     and (p.subscription_end_date is null or p.subscription_end_date > now())
      then 'REDUNDANTE — el plan ya le da prioridad, se puede apagar sin efecto'
    else 'AMBIGUO — o es residuo del plan vencido, o es concesión del admin'
  end                                               as diagnostico
from public.businesses b
left join public.profiles p on p.id = b.owner_id
where b.search_priority_boost is true
order by diagnostico, b.name;

-- ── 2. Apagar SÓLO lo redundante ───────────────────────────────────────────
--
-- Se apaga únicamente donde el dueño TIENE plan Destaca o superior vigente:
-- ahí la columna no aporta nada porque el tier ya concede la prioridad en
-- vivo, así que apagarla no le quita nada a nadie.
--
-- Lo AMBIGUO no se toca a propósito. Un negocio sin plan vigente y con la
-- bandera encendida puede ser residuo del plan caducado (habría que apagarlo)
-- o una concesión que un administrador hizo a mano (hay que respetarla), y
-- desde la base no hay forma de distinguirlos: nadie guardó quién la encendió.
-- Apagarlas todas silenciaría concesiones legítimas sin avisar a quien las
-- hizo. Se dejan en la lista del PASO 1 para que un humano decida.

update public.businesses b
set search_priority_boost = false
from public.profiles p
where p.id = b.owner_id
  and b.search_priority_boost is true
  and coalesce(p.subscription_tier, 0) >= 2
  and (p.subscription_end_date is null or p.subscription_end_date > now());

-- ── 3. Verificación ────────────────────────────────────────────────────────
-- `redundantes_restantes` debe dar 0. `ambiguos` es la lista que queda por
-- revisar a mano; si da 0, no hay nada más que hacer.

select
  count(*) filter (
    where coalesce(p.subscription_tier, 0) >= 2
      and (p.subscription_end_date is null or p.subscription_end_date > now())
  )                                                 as redundantes_restantes,
  count(*) filter (
    where coalesce(p.subscription_tier, 0) < 2
       or (p.subscription_end_date is not null and p.subscription_end_date <= now())
  )                                                 as ambiguos
from public.businesses b
left join public.profiles p on p.id = b.owner_id
where b.search_priority_boost is true;
