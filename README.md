# App Encuentra

Directorio de negocios locales de Venezuela. Las personas encuentran negocios
cerca, ven reseñas reales y escriben directo al dueño; los negocios consiguen
visibilidad, contacto y promociones.

En producción: **[appencuentra.com](https://appencuentra.com)** — se despliega
solo desde la rama `main` vía Vercel.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) · React 18 · TypeScript |
| Estilos | Tailwind CSS · framer-motion para overlays |
| Datos y sesión | Supabase (Postgres + Auth + Storage), con RLS |
| Correo | Resend |
| Pagos | PayPal, Binance Pay, y comprobantes manuales revisados a mano |
| Instalable | PWA |

## Levantarlo en local

```bash
npm install
cp .env.example .env.local   # y completar los valores
npm run dev                  # http://localhost:3000
```

Antes de subir cualquier cambio:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

El build es la red de seguridad real: `npm run dev` tolera errores de tipos que
`build` rechaza, y Vercel construye con `build`.

## Variables de entorno

Las imprescindibles para que arranque:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # SOLO servidor — salta RLS, nunca exponer al cliente
NEXT_PUBLIC_APP_URL
```

Según lo que necesites: `RESEND_API_KEY` y `RESEND_FROM_*` (correo),
`PAYPAL_*` y `BINANCE_PAY_*` (cobros), `ADMIN_SETUP_SECRET`,
`ADMIN_MASTER_PIN` y `ADMIN_PANEL_PASSWORD` (panel), `CRON_SECRET` (limpieza
programada). La lista completa está en `.env.example`.

> `SUPABASE_SERVICE_ROLE_KEY` salta todas las políticas RLS. Sólo puede usarse
> en rutas de servidor (`src/app/api/**`, server components). Si aparece en un
> componente `"use client"`, es un incidente de seguridad.

## Base de datos

El esquema vive en dos sitios, con reglas distintas:

- **`supabase/migrations/`** — lo nuevo. Va numerado y en orden, así que se
  sabe qué sigue a qué. Para que además quede *registrado* —en
  `supabase_migrations.schema_migrations`, que es lo que permite saber qué
  corrió sin adivinar— hay que aplicarlo con el CLI, y para eso falta enlazar
  el proyecto:

  ```bash
  supabase init                        # crea supabase/config.toml
  supabase link --project-ref <ref>    # el ref está en la URL del panel
  supabase db push
  ```

  Mientras no se haga, pegar las migraciones a mano en el editor funciona
  igual pero no deja registro, que es justo lo que se venía a resolver.
- **`scripts/`** — lo anterior. Se pega a mano en el SQL Editor y no deja
  registro de nada. Está escrito para ser idempotente: correrlo dos veces no
  rompe nada.

Todo cambio de esquema nuevo va como migración. `scripts/` no se amplía.

De `scripts/`, los que tienen que estar sí o sí para que la app funcione
completa:

| Script | Para qué |
|---|---|
| `support-table.sql` | Formulario de soporte y su bandeja en el panel |
| `panel-admin-control.sql` | Moderación de reseñas, suspensión, reversión de pagos y auditoría |
| `ocultar-negocio.sql` | Ocultar un negocio del directorio sin eliminarlo |
| `create-storage-bucket.sql` | Bucket `payment_receipts` — **debe quedar privado** |

Para saber qué falta en una base concreta:
`scripts/verificar-scripts-aplicados.sql`. Solo lee, y devuelve una fila por
script con lo que falta cuando falta.

> El bucket `payment_receipts` contiene comprobantes de pago: capturas de
> transferencias con nombres y números de cuenta. Tiene que seguir siendo
> privado; el panel genera URLs firmadas de una hora para mostrarlos.
>
> El script lo crea privado y, si lo encuentra abierto, lo cierra: pone
> `public = false` también cuando el bucket ya existe, y borra la política de
> lectura pública. Hasta el 25/09 hacía lo contrario —lo creaba con
> `public = true`— pese a este mismo párrafo tres líneas más arriba. La base de
> producción estaba privada, así que no llegó a hacer daño, pero quedaba
> armado para quien rehiciera el bucket.
>
> Para comprobar el estado de una base concreta:
> `scripts/verificar-scripts-aplicados.sql`.

## Permisos de administrador

**`profiles.is_admin` es la única fuente de verdad.** No se lee
`user_metadata.is_admin` en ninguna decisión de permiso: ese campo lo puede
escribir el propio usuario desde el navegador, así que aceptarlo era una
escalada de privilegios directa.

Para conceder el rol se actualiza la fila directamente en Supabase. Había una
ruta `/api/admin/set-admin` para esto, sin autenticación y protegida sólo por
un secreto de instalación; se eliminó porque ya hay administrador y una puerta
así no tiene por qué seguir abierta. De todos modos llevaba tiempo sin
funcionar: leía `ADMIN_SETUP_SECRET` y la variable configurada se llama
`ADMIN_SETUP_KEY`.

```sql
update public.profiles set is_admin = true where email = 'correo@ejemplo.com';
```

Para comprobarlo:

```sql
select id, email, is_admin from public.profiles where email = 'correo@ejemplo.com';
```

Toda acción del panel que modere, suspenda o revierta queda registrada en
`admin_audit_log` y se consulta en **Registro → Auditoría**.

## Cómo está organizado

```
src/
  app/
    (public)/        páginas públicas anidadas (soporte, términos, privacidad)
    app/auth/        registro, acceso, recuperación
    app/dashboard/   la app con sesión
    app/admin/       panel interno
    api/             rutas de servidor
  components/ui/     primitivas compartidas — Overlay, SectionHeader, BottomNav
  lib/               lógica de dominio (membresías, navegación, auditoría)
scripts/             SQL, se ejecuta a mano en Supabase
docs/                guías de configuración de servicios externos
```

Dos convenciones que conviene respetar, porque se rompieron antes:

- **Lo compartido vive en un solo sitio.** Los encabezados, la barra inferior y
  los destinos de navegación están centralizados a propósito: cada vez que algo
  se copió por pantalla, terminó divergiendo.
- **La paleta se toca en `tailwind.config.ts` y `globals.css`, nunca por
  pantalla.** Los colores de marca salen del logo; `purple` está remapeado a
  magenta (promociones) y el dorado (`amber`) es el nivel Patrocina.

## Documentación adicional

En `docs/`: configuración de Google OAuth, PWA, cron de limpieza, PayPal,
sistema de afiliados, reclamo de negocios y pagos manuales.

El historial de git es el registro de qué cambió y por qué. Los mensajes de
commit explican el motivo, no sólo el qué — antes eso vivía en un centenar de
archivos markdown sueltos en la raíz que nadie actualizaba y que terminaron
contradiciendo al código.
