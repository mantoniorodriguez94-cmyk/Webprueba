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

El esquema se aplica con los scripts de `scripts/`, ejecutados a mano en el SQL
Editor de Supabase. Están escritos para ser idempotentes: correrlos dos veces no
rompe nada.

Los que tienen que estar sí o sí para que la app funcione completa:

| Script | Para qué |
|---|---|
| `support-table.sql` | Formulario de soporte y su bandeja en el panel |
| `panel-admin-control.sql` | Moderación de reseñas, suspensión, reversión de pagos y auditoría |
| `referral-rewards-table.sql` | Evita otorgar el mes gratis de referidos más de una vez |
| `create-storage-bucket.sql` | Bucket `payment_receipts` — **debe quedar privado** |

Para saber qué falta en una base concreta, el bloque de verificación está al
final de `panel-admin-control.sql`.

> El bucket `payment_receipts` contiene comprobantes de pago: capturas de
> transferencias con nombres y números de cuenta. Tiene que seguir siendo
> privado; el panel genera URLs firmadas de una hora para mostrarlos.

## Permisos de administrador

**`profiles.is_admin` es la única fuente de verdad.** No se lee
`user_metadata.is_admin` en ninguna decisión de permiso: ese campo lo puede
escribir el propio usuario desde el navegador, así que aceptarlo era una
escalada de privilegios directa.

Para conceder el rol: `POST /api/admin/set-admin` con `ADMIN_SETUP_SECRET`. Para
comprobarlo:

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
