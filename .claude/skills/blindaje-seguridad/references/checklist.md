# Las 20 cosas que se olvidan — qué mirar en App Encuentra

Para cada punto: **qué es**, **el comando concreto para este stack**, **qué separa el riesgo real del falso positivo**, y **cómo se blinda**.

El orden es el de la lista original, no el de gravedad. Si vas a hacer la pasada entera, ataca por capas como dice el SKILL.md: primero 1-2 (claves), luego 5-6-8-15-17 (la puerta), luego 3-4-7 (lo de adentro), luego 9-10-16 (lo que entra).

Los puntos **3, 4, 7, 16 y 20** son los que más daño hacen en esta app concreta. Si solo tienes tiempo para cinco, son esos.

---

## 1. Claves en GitHub

Una clave que estuvo commiteada sigue en el historial aunque hoy no esté en el árbol.

```bash
git log --all --full-history -- '*.env' '*.env.local' '*.env.production'
git log -p --all -S 'SERVICE_ROLE' --oneline | head -40
git log -p --all -S 'eyJ' --oneline | head -40   # cabecera de un JWT de Supabase
git ls-files | grep -iE '\.env|key|secret|credential'
```

**Riesgo real:** la clave aparece en algún commit y sigue siendo válida. Da igual que el repo sea privado: los colaboradores, los forks y cualquier integración con acceso la ven.

**Falso positivo:** `.env.example` con valores de relleno. Compruébalo antes de alarmar — si trae un JWT real, no es relleno.

**Blindaje:** rotar la clave (esto primero, borrar el archivo no la invalida), luego limpiar el historial si hace falta. **Rotar rompe producción en el momento: pregunta antes.** El orden es rotar en Supabase/PayPal/Binance → actualizar en Vercel → desplegar → invalidar la vieja.

## 2. Claves a la vista

En Next.js, todo lo que empieza por `NEXT_PUBLIC_` se incrusta en el JavaScript que descarga el navegador. Cualquiera lo lee.

```bash
grep -rn 'NEXT_PUBLIC_' src .env.example next.config.js | grep -viE 'SUPABASE_URL|SUPABASE_ANON_KEY|SENTRY_DSN|SITE_URL|PAYPAL_CLIENT_ID'
grep -rn 'SERVICE_ROLE\|RESEND_API_KEY\|BINANCE_SECRET\|PAYPAL_SECRET' src --include=*.tsx
grep -rln "'use client'" src | xargs grep -ln 'SERVICE_ROLE' 2>/dev/null
npm run build && grep -rl 'service_role' .next/static 2>/dev/null   # la prueba definitiva
```

**Riesgo real:** un secreto con prefijo `NEXT_PUBLIC_`, o `SUPABASE_SERVICE_ROLE_KEY` importado desde un archivo que acaba en el bundle del cliente. La service role key se salta RLS entera: filtrarla es entregar la base de datos completa.

**Falso positivo:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño y no es un hallazgo — su seguridad depende de RLS (punto 3), no del secreto.

**Blindaje:** quitar el prefijo y mover el uso a servidor. `src/lib/supabase/admin.ts` es el único sitio que debe tocar la service role, y solo desde rutas de API o server actions.

## 3. Base sin reglas de acceso — RLS

**El punto más grave de esta app.** El navegador habla directo con Supabase usando la clave anónima. Sin RLS, cualquiera lee y escribe cualquier tabla desde la consola del navegador, aunque ninguna pantalla la muestre.

```bash
grep -rn 'ENABLE ROW LEVEL SECURITY' supabase/migrations supabase-setup.sql
grep -rn 'CREATE POLICY' supabase/migrations supabase-setup.sql | wc -l
grep -rnoE 'CREATE TABLE (IF NOT EXISTS )?[a-z_."]+' supabase/migrations supabase-setup.sql
grep -rnoE "from\(['\"][a-z_]+['\"]\)" src --include=*.ts --include=*.tsx | grep -oE "from\(['\"][a-z_]+" | sort -u
```

Compara las tres listas: **cada tabla que el código consulta tiene que tener RLS activo y al menos una política.** Hoy el repo tiene muchas más tablas que políticas, así que empieza por aquí y por la comprobación real:

```sql
-- en el SQL editor de Supabase: tablas sin RLS
select tablename from pg_tables where schemaname='public'
  and tablename not in (select tablename from pg_policies where schemaname='public');
```

**Riesgo real:** tabla sin RLS que contiene datos de usuarios (perfiles, mensajes, pagos, reportes). Confírmalo atacando: `ataques.md` §3.

**Falso positivo:** tablas de catálogo de lectura pública (categorías, planes). Necesitan RLS activo igual, con una política de solo lectura — "público" no es lo mismo que "escribible".

**Blindaje:** una migración nueva por tabla. `ENABLE ROW LEVEL SECURITY` y políticas separadas por operación; `auth.uid() = user_id` para lo propio, y nunca `USING (true)` en un `UPDATE` o `DELETE`. Activar RLS en una tabla que hoy funciona sin él **rompe la app hasta que las políticas estén bien: pregunta antes y propón la migración, no la apliques sola.**

## 4. Ver datos de otro por URL — IDOR

Cambiar un id en la URL o en el cuerpo de la petición y recibir datos ajenos.

```bash
find src/app -type d -name '\[*\]'
grep -rn 'params\.\|searchParams' src/app --include=*.tsx --include=*.ts | head -40
grep -rn 'body\.\(userId\|user_id\|businessId\|profileId\|negocioId\|conversationId\)' src/app/api
```

Por cada uno pregunta: **¿quién dice que ese id es suyo?** Si el id viene de la petición y la consulta no cruza contra `auth.uid()` ni contra el `user.id` de la sesión, es IDOR.

Mira con lupa `api/chat/create-conversation`, `api/business/claim` y todo `api/memberships/*`: son las rutas donde un id ajeno causa daño directo.

**Riesgo real:** la respuesta trae datos de otro usuario, o la escritura se aplica sobre un registro ajeno. Confírmalo con dos cuentas: `ataques.md` §4.

**Falso positivo:** la ruta usa el cliente normal de Supabase (no el admin) y RLS filtra por debajo. Verifica que RLS existe de verdad en esa tabla — si no, no es falso positivo.

**Blindaje:** no aceptar nunca el id del actor desde el cuerpo de la petición; sacarlo de la sesión. Y donde se use `getAdminClient()`, comprobar la propiedad a mano, porque RLS no te cubre ahí.

## 5. Login sin límite

Sin tope de intentos, una contraseña débil se adivina a fuerza bruta.

```bash
grep -rniE 'rate.?limit|throttle|intentos|cooldown|backoff' src
```

**Hoy no hay nada de esto en el repo** salvo un contador de UI en `forgot-password/page.tsx`, que es cosmético: se salta llamando a la API directamente.

**Riesgo real:** login, registro, recuperación de contraseña y **el PIN de admin** (`api/admin/security/pin`) aceptan intentos ilimitados. El PIN es el peor: suele ser corto y numérico, y protege las acciones destructivas.

**Falso positivo:** Supabase Auth aplica sus propios límites a `signInWithPassword` y al envío de correos. Confirma cuáles están activos en el panel antes de reportar el login como abierto — pero esos límites **no cubren tus rutas propias**, y el PIN es una ruta propia.

**Blindaje:** límite por IP y por cuenta en las rutas propias. Lo mínimo útil para el PIN: contador en base de datos, bloqueo temporal tras N fallos y registro del intento en `src/lib/auditoria.ts`.

## 6. Contraseñas sin encriptar

```bash
grep -rniE 'password|contrasena|contraseña|pin' src/lib src/utils src/app/api --include=*.ts | grep -viE 'type=|placeholder|label|input|\.password\b' | head -30
grep -rn 'MASTER_PIN\|ADMIN_PIN' src .env.example
```

**Riesgo real:** una contraseña o un PIN comparado en texto plano, guardado en una columna, o escrito en un log. Mira cómo valida el PIN maestro `api/admin/security/pin`: si compara contra una variable de entorno con `===`, revisa también que no se registre el valor en ningún `console.log`.

**Falso positivo:** Supabase Auth cifra las contraseñas de usuario; no las toques ni las reportes.

**Blindaje:** hash con sal para cualquier secreto propio, comparación en tiempo constante, y nunca en un log ni en Sentry.

## 7. Permisos solo en pantalla

Esconder el botón no es un permiso. La API responde igual si la llamas directo.

```bash
for f in $(find src/app/api -name 'route.ts'); do
  grep -q 'checkAdminAuth\|isAdmin\|auth.getUser\|getSession' "$f" || echo "SIN GUARDIA: $f"
done
grep -rLn 'isAdmin' $(grep -rl 'checkAdminAuth' src/app/api) 2>/dev/null
grep -rn 'isAdmin' src/components src/app --include=*.tsx | grep -iE 'show|hidden|visible|&&' | head -20
```

**Riesgo real:** una ruta bajo `/api/admin/` sin `checkAdminAuth()`, o que llama a `checkAdminAuth()` pero no comprueba `user.isAdmin` —solo que haya sesión—, lo que deja entrar a cualquier usuario registrado. Comprueba también que las acciones destructivas (borrar usuario, aprobar pago, difusión masiva) exigen además la cookie `admin_master_ok`.

**Falso positivo:** `api/admin/security/logout` no lleva guardia a propósito; solo borra una cookie. Ya está en el registro de decisiones.

**Blindaje:** la guardia va al principio de cada handler, antes de leer el cuerpo. Mismo patrón en todas, para que la ausencia salte a la vista.

## 8. Mail sin verificar

Sin verificación, cualquiera se registra con el correo de otro y recibe lo que vaya dirigido a esa dirección.

```bash
grep -rn 'signUp\|emailRedirectTo' src --include=*.ts --include=*.tsx
grep -rn 'email_confirmed_at\|email_verified' src
```

**Riesgo real:** la app da acceso o beneficios antes de confirmar el correo — sobre todo en el reclamo de negocios (`api/business/claim`), donde el correo puede ser la prueba de que eres el dueño.

**Falso positivo:** "Confirm email" activado en el panel de Supabase lo cubre. Verifícalo en el panel antes de reportarlo.

**Blindaje:** activar la confirmación en Supabase y, en las rutas sensibles, comprobar `email_confirmed_at` además de la sesión.

## 9. Formularios sin filtro

Todo lo que escribe el usuario termina en la base y en la pantalla de otro.

```bash
grep -rn 'dangerouslySetInnerHTML' src
grep -rn 'await request.json()' src/app/api | wc -l
grep -rn 'await request.json()' src/app/api   # ¿cuántas validan lo que llega?
```

**Riesgo real:** `dangerouslySetInnerHTML` con texto del usuario es XSS directo. En la API, un cuerpo que se usa sin comprobar tipos ni longitudes: se cuelan nulos, números donde esperabas texto, campos que no tocaban (`is_admin`, `tier`, `verified`) si el objeto se pasa entero a un `update`.

**Falso positivo:** React escapa el texto por defecto. Interpolar `{texto}` en JSX no es XSS.

**Blindaje:** validar forma y longitud al entrar, y **nunca pasar el objeto del cuerpo entero a un `insert` o `update`** — enumera los campos permitidos a mano.

## 10. Archivos sin revisar

```bash
grep -rn 'storage.from\|upload(' src --include=*.ts --include=*.tsx | head -20
grep -rn 'accept=' src/components --include=*.tsx | head
```

**Riesgo real:** validar el tipo solo en el navegador (`accept=` es una sugerencia, se salta), o un bucket público que acepta SVG — un SVG ejecuta JavaScript cuando se abre directo.

**Falso positivo:** los cinco buckets ya están cerrados con lista blanca, tope de tamaño y `payment_receipts` privado. Está en el registro; no lo levantes de nuevo salvo que haya un bucket nuevo.

**Blindaje:** la restricción manda en el bucket, no en el formulario. Para un bucket nuevo: lista blanca de MIME, límite de tamaño, y privado si contiene datos de una persona.

## 11. Errores que muestran código

Un stack trace le dibuja al atacante la estructura de tu backend.

```bash
grep -rn 'error.message\|error.stack\|JSON.stringify(error' src/app/api | head -30
grep -rn 'console.log\|console.error' src/app/api | wc -l
cat sentry.server.config.ts sentry.edge.config.ts
```

**Riesgo real:** una ruta que devuelve `error.message` de Postgres al cliente — filtra nombres de tablas y columnas, que es justo lo que hace falta para atacar RLS. Y un `console.log` de un cuerpo de petición que contenga tokens o datos personales acaba en los logs de Vercel y en Sentry.

**Falso positivo:** un mensaje genérico propio ("No autorizado") está bien.

**Blindaje:** mensaje genérico y código de estado para el cliente; el detalle, al log del servidor. Revisa que Sentry no esté enviando cuerpos de petición ni cabeceras.

## 12. Librerías viejas

```bash
npm audit --omit=dev
npm outdated
```

**Riesgo real:** una vulnerabilidad **alcanzable desde fuera** en una dependencia de producción — Next.js, `@supabase/*`, `next-pwa`. Next 15.5.25 es reciente, pero las de Next se explotan desde internet sin cuenta: míralo en cada pasada.

**Falso positivo:** vulnerabilidades en dependencias de desarrollo (eslint, tailwind, postcss) o en rutas de código que la app no ejecuta. Dilo y no infles.

**Blindaje:** actualizar lo alcanzable, empezando por Next. Las menores primero y comprobando el build.

## 13. Sin backups

```bash
ls supabase/migrations | wc -l
```

**Riesgo real:** el plan gratuito de Supabase no tiene *point-in-time recovery*. Si alguien borra datos —o un `delete` sin `where` en una ruta de admin—, no hay vuelta atrás. Esto no es un ataque, es lo que hace que un ataque sea definitivo.

**Falso positivo:** no inventes el estado del plan. Si no lo sabes, dilo y que el usuario lo mire en el panel.

**Blindaje:** comprobar la retención en el panel; si es el plan gratuito, al menos un volcado periódico del esquema y de las tablas con datos de usuarios.

## 14. Admin compartido

Si todos entran con la misma cuenta, no hay forma de saber quién hizo qué.

```bash
cat src/lib/auditoria.ts | head -40
grep -rn 'registrarAuditoria\|auditoria' src/app/api/admin | wc -l
grep -rn 'ADMIN_EMAIL\|admin@' src .env.example
```

**Riesgo real:** las acciones destructivas no quedan registradas, o el registro no dice qué administrador fue. El repo ya tiene `src/lib/auditoria.ts` y una pantalla de auditoría: comprueba que las rutas que borran, aprueban pagos o difunden correos lo llaman de verdad.

**Blindaje:** registro con id de administrador, acción y objetivo, en toda ruta destructiva. El registro no se edita ni se borra desde la app.

## 15. Sin doble factor

**Riesgo real:** una contraseña de admin filtrada da control total. La cookie `admin_master_ok` es un segundo factor *parcial* —algo que sabes, no algo que tienes— y protege solo las rutas que la exigen. Comprueba cuáles la exigen y cuáles no: si aprobar un pago no la pide y borrar un usuario sí, la protección es desigual y hay que decirlo.

**Blindaje:** 2FA real (TOTP) en las cuentas de administrador desde Supabase Auth. Mientras tanto, extender la exigencia del PIN a todas las acciones destructivas y que caduque pronto (punto 17).

## 16. Pagos sin chequear

Aquí se pierde dinero directamente.

```bash
sed -n '1,80p' src/app/api/memberships/paypal/webhook/route.ts
sed -n '1,80p' src/app/api/memberships/binance/webhook/route.ts
grep -rn 'amount\|monto\|precio\|price' src/app/api/memberships/*/create-order/route.ts
grep -rniE 'idempoten|ya procesado|duplicad|order_id.*exist' src/app/api/memberships
```

Cuatro cosas, y las cuatro tienen que estar:

1. **Firma verificada** — ya está en ambos webhooks. Confirmado por lectura, no atacando.
2. **Importe validado en el servidor** — si el precio viaja en el cuerpo desde el navegador, el usuario paga 1 $ por el plan de 50 $. El precio sale de `src/lib/memberships/tiers.ts`, nunca de la petición.
3. **Idempotencia** — el mismo webhook llega dos veces (los pasarelas reintentan). Sin control, se acreditan meses de más. **Este repo ya tuvo ese fallo**, así que verifícalo de verdad.
4. **El estado del pago manda, no la redirección** — volver a la URL de "gracias" no es haber pagado.

**Blindaje:** validar importe y moneda contra el catálogo del servidor; guardar el id de la orden con restricción de unicidad y salir temprano si ya estaba procesada.

## 17. Sesiones eternas

```bash
grep -rn 'maxAge\|expires\|cookies.set' src/app/api src/middleware.ts src/lib/utils/cookies.ts
```

**Riesgo real:** la cookie `admin_master_ok` sin `maxAge` corto, o sin `httpOnly`, `secure` y `sameSite`. Si dura la sesión entera, el "PIN para acciones sensibles" se pide una vez y ya. Mira cómo se emite en `api/admin/security/pin/route.ts`.

**Falso positivo:** las sesiones de usuario normal las rota Supabase con refresh tokens; eso está bien.

**Blindaje:** PIN con caducidad de minutos, no de horas. `httpOnly: true`, `secure: true`, `sameSite: 'lax'` o `'strict'`.

## 18. Claude con acceso total

El agente que escribe el código es otra superficie de ataque.

```bash
cat .claude/settings.json .claude/settings.local.json 2>/dev/null
ls .claude/skills .claude/hooks 2>/dev/null
grep -rn 'SERVICE_ROLE\|SECRET' .claude 2>/dev/null
ls .github/workflows 2>/dev/null && grep -rn 'secrets\.' .github/workflows 2>/dev/null
```

**Riesgo real:** credenciales de producción al alcance del agente, permisos amplios concedidos de forma permanente, o un workflow que le da secretos a un agente que ejecuta código venido de un PR externo.

**Falso positivo:** permisos de lectura y de herramientas de desarrollo no son un hallazgo.

**Blindaje:** el agente trabaja contra un proyecto de pruebas, no contra la base de producción. Nada de service role en su entorno. Y revisar el diff antes de fusionar, que es el punto 20.

## 19. Nunca la atacaste vos

No es un punto de la lista: es la condición para que los otros 19 valgan algo. El manual está en `ataques.md`. **Hasta que no lances las peticiones, lo que tienes son sospechas.**

## 20. Lo que la IA agregó y nadie leyó

El punto que falta en la lista original, y el que explica por qué existe esta habilidad.

El código escrito por IA es sintácticamente correcto, parece revisado y **asume que quien lo llama es la propia interfaz**. Ahí es donde aparecen las guardias olvidadas: la ruta nueva que copió el patrón de otra pero se dejó el `checkAdminAuth`, la tabla nueva sin RLS porque la migración creó la tabla y no la política, el `update` que pasa el cuerpo entero.

```bash
git log --oneline -30
git diff HEAD~10 --stat
git diff HEAD~10 -- src/app/api | grep -E '^\+' | grep -iE 'from\(|update\(|insert\(|delete\(|getAdminClient'
find src/app/api -name 'route.ts' -newer package.json
```

**Qué buscar:** rutas de API nuevas (¿tienen guardia?), tablas nuevas (¿tienen RLS?), `getAdminClient()` nuevo (¿comprueba propiedad?), y archivos mal nombrados que delatan prisa — `src/app/api/admin/deactivate/rroute.ts` no es una ruta de Next, así que ese endpoint no existe aunque haya código dentro; mira si algo lo llama.

**Blindaje:** pasar esta habilidad después de cada tanda grande de código generado, no solo antes de lanzar. Es el punto que más vulnerabilidades encuentra por minuto invertido en esta app.
