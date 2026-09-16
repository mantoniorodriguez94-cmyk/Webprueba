# Migraciones y scripts SQL

Cómo está el esquema hoy, qué hay en cada carpeta, y qué se puede volver a
ejecutar sin romper nada.

## El problema en una frase

La base de producción se armó **corriendo scripts a mano** en el SQL Editor de
Supabase. La CLI de Supabase lleva su propio registro de lo aplicado en
`supabase_migrations.schema_migrations`, y **ahí no hay nada anotado**. Así que
la CLI cree que todo está pendiente.

## La trampa

```bash
supabase db push   # ← NO correr esto contra producción todavía
```

La CLI vería las 9 migraciones de `supabase/migrations/` como pendientes e
intentaría aplicarlas todas sobre una base donde 8 de ellas ya están puestas.

Ocho aguantan la reejecución. Una no. El detalle está abajo.

## Las dos carpetas

| | Qué es | Cuántos |
|---|---|---|
| `supabase/migrations/` | Migraciones con fecha, formato CLI. Todas de sep 2026. | 9 |
| `scripts/` | SQL suelto ejecutado a mano, de nov 2025 en adelante. | 64 |

Ninguna migración tiene ya copia en `scripts/`. Ocho la tenían —byte a byte— y
se eliminaron: mientras existan dos copias del mismo SQL, alguien edita una y
empiezan a divergir sin que nadie sepa cuál refleja la base. La fuente única es
`supabase/migrations/`.

Si buscás alguno de esos ocho por su nombre viejo:

| Nombre anterior en `scripts/` | Dónde está ahora |
|---|---|
| `un-negocio-por-cuenta.sql` | `20260914110001_un_negocio_por_cuenta.sql` |
| `beneficios-sueltos.sql` | `20260914110002_beneficios_sueltos.sql` |
| `limite-fotos-por-plan.sql` | `20260914110003_limite_fotos_por_plan.sql` |
| `limpiar-columnas-borde-dorado.sql` | `20260914110004_limpiar_columnas_borde_dorado.sql` |
| `gallery-urls-a-array.sql` | `20260914120001_gallery_urls_a_array.sql` |
| `resenas-cliente-verificado.sql` | `20260914130001_resenas_cliente_verificado.sql` |
| `resenas-solo-negocios-reclamados.sql` | `20260914140001_resenas_solo_negocios_reclamados.sql` |
| `chat-tiempo-real.sql` | `20260914150001_chat_tiempo_real.sql` |

## Estado de las 9 migraciones

Verificado leyendo cada archivo: qué pasa si se vuelve a aplicar sobre una base
que ya la tiene.

| Migración | ¿Re-ejecutable? | Por qué |
|---|---|---|
| `20260914110001_un_negocio_por_cuenta` | Sí | `create unique index if not exists` |
| `20260914110002_beneficios_sueltos` | Sí | `or replace` + `drop trigger if exists` |
| `20260914110003_limite_fotos_por_plan` | Sí | `or replace` + `drop trigger if exists` |
| `20260914110004_limpiar_columnas_borde_dorado` | Sí | `drop column if exists` |
| `20260914120001_gallery_urls_a_array` | **No** | ver abajo |
| `20260914130001_resenas_cliente_verificado` | Sí | `or replace` + `drop … if exists` |
| `20260914140001_resenas_solo_negocios_reclamados` | Sí | `drop policy if exists` |
| `20260914150001_chat_tiempo_real` | Sí | `or replace` + `drop trigger if exists` |
| `20260915120001_columnas_muertas` | Sí | `drop column if exists` ×3 |

### La excepción: `gallery_urls_a_array`

```sql
ALTER TABLE public.businesses
  ALTER COLUMN gallery_urls TYPE text[]
  USING public.json_a_text_array(gallery_urls);
```

La conversión no tiene guarda. Sobre una columna que ya es `text[]`, Postgres no
encuentra `json_a_text_array(text[])` y **falla con error**.

Que falle es la parte buena: aborta la transacción y no deja la columna a medias.
No corrompe datos — corta el `db push` y no se aplica nada de lo que venía
después.

## Qué hay en `scripts/`

### Esquema vigente — imprescindibles

Sin estos la app no funciona completa. Ya están aplicados en producción.

| Script | Para qué |
|---|---|
| `support-table.sql` | Formulario de soporte y su bandeja en el panel |
| `panel-admin-control.sql` | Moderación, suspensión, reversión de pagos y auditoría |
| `referral-rewards-table.sql` | Evita otorgar el mes gratis de referidos dos veces |
| `create-storage-bucket.sql` | Bucket `payment_receipts` — **debe quedar privado** |
| `ocultar-negocio.sql` | Política que saca un negocio del directorio |

El bloque de verificación al final de `panel-admin-control.sql` dice qué falta
en una base concreta.

### Diagnóstico — solo lectura

No escriben nada. Se pueden correr cuando sea, contra lo que sea.

`inventario-esquema.sql` es el que hace falta para el baseline del paso 1: saca
la forma real del esquema sin leer datos.

`diagnostico-admin-completo.sql` · `diagnostico-permisos.sql` ·
`step1-check-view-definition.sql` · `verify-paypal-setup.sql` ·
`verify-created-at-field.sql` · `check-businesses-dates.sql` ·
`debug-premium-payment.sql`

### Semillas

| Script | Estado |
|---|---|
| `seed-venezuela-locations.sql` | Vigente. Usa `on conflict`, se puede repetir. |
| `seed-businesses.sql` | **Obsoleto.** Ver aviso abajo. |
| `seed-businesses.js` | Obsoleto. Nunca funcionó bien con RLS. |

> **`seed-businesses.sql` no debe correrse contra producción.** Inserta 10
> negocios de demostración con direcciones de **Colombia** y fotos de Unsplash,
> y les asigna como dueño al primer usuario que encuentre. No rompe el esquema:
> borra sus propios 10 negocios por nombre antes de insertarlos, así que se
> puede repetir. Lo que hace es ensuciar el directorio en vivo con fichas falsas
> de otro país.

### Histórico — ya aplicados, no volver a correr

El resto son arreglos puntuales y construcciones de tabla de entre nov 2025 y
feb 2026. Ya están en producción. Se conservan porque documentan por qué el
esquema es como es, no porque haya que ejecutarlos.

Los que **no** son idempotentes, si a alguien se le ocurre:

| Script | Qué haría |
|---|---|
| `fix-created-at-type-complete.sql` | Conversión de tipo + `delete` |
| `FIX-CREATED-AT-AUTOMATICO.sql` | Conversión de tipo |
| `step2-fix-created-at-final.sql` | Conversión de tipo |
| `actualizar-planes-premium-diversificados.sql` | 4 `insert` sin `on conflict` + `update` masivo |
| `create-affiliate-system.sql` | `insert` sin `on conflict` |
| `setup-manual-payments-complete.sql` | `insert` sin `on conflict` |

Además, seis scripts traen un **correo hardcodeado** del administrador
(`create-admin-role.sql`, `otorgar-admin.sql`, `fix-admin-*.sql`,
`restore-admin-mantonio-safe.sql`, `diagnostico-admin-completo.sql`). Conceden
permisos a esa cuenta concreta. Hoy el rol se da con un `update` directo, como
explica el README.

## Cómo salir de los dos sistemas

El objetivo es que `supabase db push` sea seguro. Hacen falta tres pasos, y el
primero necesita leer el esquema real.

### Paso 1 — Baseline (requiere acceso a la base)

Una migración que describa cómo está producción **hoy**, con fecha anterior a
todas las demás. Se genera desde la base, no a mano: escribirla adivinando desde
los scripts sueltos es donde se cuela el error, porque se aplicaron en distinto
orden y varios se pisan entre sí.

Hay dos caminos según lo que tengas a mano.

**A. Con la CLI** — el camino corto, si podés instalarla:

```bash
supabase db dump --schema public -f supabase/migrations/20260101000000_baseline.sql
```

Sobre una **copia** de producción, nunca sobre producción.

**B. Desde el SQL Editor** — el camino que no necesita instalar nada, y que
encaja con cómo se viene trabajando:

```
Supabase → SQL Editor → pegar scripts/inventario-esquema.sql → Run
```

Devuelve una sola celda de texto con la forma real del esquema: tablas,
columnas, tipos, restricciones, índices, funciones, triggers, políticas RLS y
el estado del registro de la CLI. **Es de solo lectura y no toca ni una fila de
datos** — sólo consulta los catálogos de Postgres. Con esa salida se escribe el
baseline.

### Paso 2 — Marcar lo ya aplicado

Que la CLI sepa que esas migraciones no hay que correrlas:

```bash
supabase migration repair --status applied 20260101000000
supabase migration repair --status applied 20260914110001
# … una por cada migración existente
```

Esto solo escribe en `supabase_migrations.schema_migrations`. No toca el
esquema.

### Paso 3 — Probar antes de tocar producción

```bash
supabase db reset          # reconstruye desde cero en local
npx tsc --noEmit && npm run build
```

Si el reset reconstruye una base equivalente a producción, el baseline está bien.

### Reglas a partir de ahí

- Todo cambio de esquema entra como archivo en `supabase/migrations/`, con
  fecha. Nada nuevo en `scripts/`.
- Escribir cada migración para poder repetirse: `if exists`, `if not exists`,
  `or replace`, `on conflict`. Las 8 buenas ya son el ejemplo.
- Una conversión de tipo necesita guarda explícita. `gallery_urls_a_array` es el
  contraejemplo.
- `scripts/` queda como archivo histórico y caja de herramientas de diagnóstico.

## Estado actual

El paso 1 está pendiente porque requiere acceso a la base. Hasta entonces:
**no correr `supabase db push` contra producción.** El esquema se sigue
aplicando a mano, como hasta ahora.

El reparto es: correr `scripts/inventario-esquema.sql` lleva un minuto y
necesita entrar a Supabase. Escribir el baseline a partir de esa salida, y los
pasos 2 y 3, no necesitan entrar a ningún lado.
