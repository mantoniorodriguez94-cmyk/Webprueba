-- ============================================================
-- CATEGORÍAS CERRADAS
-- ============================================================
--
-- Hasta ahora `businesses.category` era texto libre y aceptaba lo que fuera.
-- El formulario de alta pedía la categoría con un campo de escritura y el
-- filtro del directorio ofrecía once opciones fijas que comparaba letra por
-- letra, así que un negocio que escribía "Panadería" —el ejemplo que daba el
-- propio formulario— no caía en ninguna, ni siquiera en "Otros". Y como el
-- feed agrupaba por el valor crudo, cualquier cosa tecleada se convertía en
-- una sección navegable: en los datos de prueba hubo categorías llamadas
-- "ewfef" y "Hajja".
--
-- Ahora la lista vive en `src/lib/categorias.ts` y se guarda el identificador
-- (`panaderia-dulceria`), no la etiqueta. Este CHECK es la otra mitad: sin él,
-- el valor válido sólo existiría en TypeScript y acabaría entrando por otro
-- camino —el panel de admin, una llamada directa a la API, un script—. Ya pasó
-- en este proyecto con `membership_payments.gateway`: se añadió 'manual' en
-- código, la restricción de la base no se actualizó, y la primera aprobación
-- de pago manual habría reventado.
--
-- SI SE TOCA LA LISTA EN TypeScript, HAY QUE TOCAR ESTE CHECK.
--
-- NULL sigue permitido: la categoría es opcional.
--
-- No hace falta convertir nada: al limpiar los negocios de prueba la tabla
-- quedó vacía. El UPDATE de abajo está por si este script se corre sobre una
-- base que sí tenga filas; con la tabla vacía no toca nada y no estorba.
-- ============================================================

-- ── 1. Llevar a la lista lo que no esté en ella ────────────────────────────
-- Las equivalencias son las mismas que hace `normalizarCategoria` en el
-- código. Lo que no se reconoce cae en 'otros', que es mejor que quedar fuera
-- del filtro para siempre.

update public.businesses
-- Sin unaccent: esa función necesita una extensión que esta base no tiene
-- instalada, y no vale la pena instalarla para esto. Las variantes con tilde
-- van escritas a mano abajo; cualquier otra cosa cae en 'otros', que es el
-- destino correcto para un valor que no se reconoce.
set category = case lower(trim(category))
  when 'restaurantes'    then 'comida-restaurantes'
  when 'comida'          then 'comida-restaurantes'
  when 'panaderia'       then 'panaderia-dulceria'
  when 'panadería'       then 'panaderia-dulceria'
  when 'pasteleria'      then 'panaderia-dulceria'
  when 'pastelería'      then 'panaderia-dulceria'
  when 'reposteria'      then 'panaderia-dulceria'
  when 'repostería'      then 'panaderia-dulceria'
  when 'abastos'         then 'viveres-abastos'
  when 'bodega'          then 'viveres-abastos'
  when 'supermercado'    then 'viveres-abastos'
  when 'peluqueria'      then 'belleza'
  when 'peluquería'      then 'belleza'
  when 'barberia'        then 'belleza'
  when 'barbería'        then 'belleza'
  when 'belleza'         then 'belleza'
  when 'farmacia'        then 'salud'
  when 'salud'           then 'salud'
  when 'ropa'            then 'ropa-calzado'
  when 'calzado'         then 'ropa-calzado'
  when 'ferreteria'      then 'hogar-ferreteria'
  when 'ferretería'      then 'hogar-ferreteria'
  when 'servicios'       then 'servicios-hogar'
  when 'taller'          then 'vehiculos-repuestos'
  when 'repuestos'       then 'vehiculos-repuestos'
  when 'tecnologia'      then 'tecnologia'
  when 'tecnología'      then 'tecnologia'
  when 'educacion'       then 'educacion'
  when 'educación'       then 'educacion'
  when 'deportes'        then 'deportes'
  when 'entretenimiento' then 'eventos'
  when 'mascotas'        then 'mascotas'
  when 'veterinaria'     then 'mascotas'
  else 'otros'
end
where category is not null
  and category not in (
    'comida-restaurantes', 'panaderia-dulceria', 'viveres-abastos', 'belleza',
    'salud', 'ropa-calzado', 'hogar-ferreteria', 'servicios-hogar',
    'vehiculos-repuestos', 'tecnologia', 'educacion', 'deportes', 'mascotas',
    'eventos', 'otros'
  );

-- ── 2. La restricción ──────────────────────────────────────────────────────

alter table public.businesses
  drop constraint if exists businesses_category_check;

alter table public.businesses
  add constraint businesses_category_check
  check (category is null or category in (
    'comida-restaurantes', 'panaderia-dulceria', 'viveres-abastos', 'belleza',
    'salud', 'ropa-calzado', 'hogar-ferreteria', 'servicios-hogar',
    'vehiculos-repuestos', 'tecnologia', 'educacion', 'deportes', 'mascotas',
    'eventos', 'otros'
  ));

comment on constraint businesses_category_check on public.businesses is
  'Lista cerrada de categorías. Debe coincidir con CATEGORIAS de src/lib/categorias.ts.';

-- ── 3. Verificación ────────────────────────────────────────────────────────
-- `fuera_de_lista` tiene que dar 0.

select
  count(*) filter (where category is null)                            as sin_categoria,
  count(*) filter (where category is not null)                        as con_categoria,
  count(*) filter (
    where category is not null and category not in (
      'comida-restaurantes', 'panaderia-dulceria', 'viveres-abastos', 'belleza',
      'salud', 'ropa-calzado', 'hogar-ferreteria', 'servicios-hogar',
      'vehiculos-repuestos', 'tecnologia', 'educacion', 'deportes', 'mascotas',
      'eventos', 'otros'
    )
  )                                                                   as fuera_de_lista
from public.businesses;
