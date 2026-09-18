-- ============================================================
-- LOS BENEFICIOS DE PAGO NO SE PUEDEN AUTOCONCEDER
-- ============================================================
--
-- Todo lo que vende la app vive como columnas de la fila del negocio, y la
-- política de UPDATE deja al dueño escribir su fila entera. RLS no restringe
-- por columna, y no había ningún disparador que lo hiciera. Es decir: un
-- negocio en plan gratis podía abrir la consola del navegador y concederse
-- prioridad en el buscador, borde dorado y promociones.
--
-- No es hipotético: `tienePrioridad()` en src/lib/memberships/perks.ts
-- devuelve true si `search_priority_boost` es true, SIN mirar el plan, y el
-- feed ordena con eso. Escribir la columna basta.
--
-- Hay precedente de cómo se resuelve: `profiles` ya tiene un disparador que
-- impide que el propio usuario se toque `is_admin` e `is_premium`
-- (scripts/update-trigger-google-oauth.sql). A `businesses` nunca se le puso
-- el equivalente.
--
-- ── POR QUÉ REVIERTE EN SILENCIO Y NO LANZA ERROR ──────────────────────────
--
-- Lanzar abortaría el UPDATE entero. Si algún día una pantalla legítima manda
-- la fila completa —cosa que hoy no pasa, pero pasa en cuanto alguien escriba
-- un formulario nuevo sin pensarlo—, el dueño no podría ni cambiar su
-- teléfono. Revirtiendo sólo esas columnas, el resto del cambio se guarda y lo
-- que no le corresponde tocar simplemente no se mueve.
--
-- Es el mismo patrón que usa cualquier framework contra la asignación masiva:
-- el campo prohibido no da error, se ignora.
--
-- ⚠ La service_role SALTA RLS pero NO salta los disparadores. Por eso el
-- disparador comprueba el rol explícitamente: sin esa comprobación
-- applyTierBenefitsToBusinesses() dejaría de funcionar, y entonces NADIE
-- podría conceder los beneficios, ni pagando.
-- ============================================================

-- ── 1. El guardián ─────────────────────────────────────────────────────────

create or replace function public.proteger_beneficios_negocio()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  /* Sin SECURITY DEFINER a propósito: sólo lee OLD y NEW, no necesita
     permisos prestados, y así `current_user` es el rol de quien escribe y no
     el dueño de la función —que es el error clásico de este patrón—.

     Se comprueban las dos señales porque miran cosas distintas: auth.role()
     lee el rol del token, current_user el rol de la conexión. Con service_role
     coinciden, pero si alguna vez una de las dos deja de estar disponible, la
     otra sostiene el permiso. Fallar del lado de bloquear al servidor sería
     peor que el agujero: nadie podría conceder beneficios ni pagando. */
  if auth.role() = 'service_role' or current_user = 'service_role' then
    return new;
  end if;

  -- Un administrador también, desde el panel.
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  -- Para todos los demás, estas columnas quedan como estaban.
  new.is_premium              := old.is_premium;
  new.premium_until           := old.premium_until;
  new.is_featured             := old.is_featured;
  new.featured_until          := old.featured_until;
  new.search_priority_boost   := old.search_priority_boost;
  new.has_gold_border         := old.has_gold_border;
  new.is_verified             := old.is_verified;
  new.verified_at             := old.verified_at;
  new.verified_by             := old.verified_by;
  new.perk_borde_dorado_hasta := old.perk_borde_dorado_hasta;
  new.perk_prioridad_hasta    := old.perk_prioridad_hasta;
  new.perk_promociones_hasta  := old.perk_promociones_hasta;
  new.perk_fotos_extra        := old.perk_fotos_extra;
  new.perk_fotos_extra_hasta  := old.perk_fotos_extra_hasta;

  -- Moderación: que un negocio no pueda desocultarse solo.
  new.hidden_at               := old.hidden_at;
  new.hidden_by               := old.hidden_by;
  new.hidden_reason           := old.hidden_reason;

  /* owner_id NO se protege acá, y es deliberado.

     Reclamar un negocio es exactamente un UPDATE de owner_id, y pasa por
     claim_business(), que es SECURITY DEFINER. Eso salta RLS pero NO salta los
     disparadores: este se ejecutaría igual y revertiría el cambio. La función
     devolvería éxito y la propiedad no se movería — un fallo silencioso en el
     camino por el que entran los negocios reales.

     Y no hace falta: la política de UPDATE lleva WITH CHECK
     (auth.uid() = owner_id), así que la fila resultante tiene que seguir
     siendo tuya. Nadie puede regalarse ni regalar un negocio. */

  return new;
end;
$$;

comment on function public.proteger_beneficios_negocio() is
  'Revierte en silencio los cambios a columnas de beneficio, verificación y moderación cuando quien escribe no es el servidor ni un administrador. owner_id queda fuera: lo protege ya el WITH CHECK de la política, y protegerlo acá rompería claim_business().';

drop trigger if exists trigger_proteger_beneficios_negocio on public.businesses;
create trigger trigger_proteger_beneficios_negocio
  before update on public.businesses
  for each row
  execute function public.proteger_beneficios_negocio();

-- ── 2. Promociones: el plan se comprueba en la base ────────────────────────
--
-- `tienePromociones()` se usaba en UN solo sitio del código: un `if` que
-- decide si pintar el módulo. La política de INSERT sólo miraba que fueras
-- dueño del negocio, así que llamando a la API directamente cualquiera
-- publicaba promociones.
--
-- La regla, copiada del código: plan Patrocina (tier 3) en adelante, o una
-- concesión de admin todavía vigente. Si cambia allá, cambia acá.

create or replace function public.negocio_puede_promocionar(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    join public.profiles p on p.id = b.owner_id
    where b.id = p_business_id
      and (
        -- Plan Patrocina vigente
        (
          coalesce(p.subscription_tier, 0) >= 3
          and (p.subscription_end_date is null or p.subscription_end_date > now())
        )
        -- o concesión manual del panel, todavía vigente
        or (b.perk_promociones_hasta is not null and b.perk_promociones_hasta > now())
      )
  );
$$;

comment on function public.negocio_puede_promocionar(uuid) is
  'true si el negocio tiene plan Patrocina vigente o una concesión de promociones sin vencer. Debe coincidir con tienePromociones() de src/lib/memberships/perks.ts.';

drop policy if exists "promociones_solo_con_plan" on public.promotions;
create policy "promociones_solo_con_plan" on public.promotions
  as restrictive for insert to authenticated
  with check (public.negocio_puede_promocionar(business_id));

-- ── 3. Verificación ────────────────────────────────────────────────────────
-- `disparador` debe dar 1 y `politica` debe dar 1.

select
  (select count(*) from pg_trigger
     where tgrelid = 'public.businesses'::regclass
       and tgname = 'trigger_proteger_beneficios_negocio')          as disparador,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'promotions'
       and policyname = 'promociones_solo_con_plan')                as politica;
