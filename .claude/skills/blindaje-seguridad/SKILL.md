---
name: blindaje-seguridad
description: Audita y blinda App Encuentra contra ataques reales — claves filtradas en el repo o en el bundle del navegador, tablas de Supabase sin RLS, datos de otro usuario accesibles cambiando un id en la URL, login sin límite de intentos, rutas de admin que solo se esconden en la pantalla pero responden igual, webhooks de pago falsificables o repetibles, subida de archivos sin filtro, errores que filtran código, dependencias viejas, sesiones que no caducan y permisos excesivos del agente de IA. Úsala siempre que el usuario pregunte si la app es "segura", si la pueden "hackear", "vulnerar", "robar datos" o "entrar", cuando pida blindar, endurecer, proteger o revisar la seguridad, antes de lanzar o de exponer una ruta nueva, después de que la IA haya escrito una tanda grande de código, o cuando algo huela a acceso indebido — aunque no use la palabra "seguridad".
---

# Blindaje de seguridad — App Encuentra

Esta habilidad busca **lo que un atacante puede hacer hoy, con las manos, contra la app en producción**: leer datos que no son suyos, escribir en nombre de otro, entrar al panel de admin, activarse una membresía sin pagar, o tumbar la cuenta de Supabase.

No es una revisión de calidad ni de cumplimiento. Para lo legal está `auditoria-legal`. Si encuentras un bug que no es explotable, anótalo aparte y sigue.

## La regla que define esta habilidad

**Un hallazgo que no puedes demostrar es una hipótesis, y las hipótesis no se reportan como vulnerabilidades.**

La diferencia entre seguridad y el resto de las revisiones es que aquí hay un adversario y los hallazgos son *comprobables*. Si crees que una ruta de admin responde sin sesión, no lo deduzcas leyendo el código: levanta la app y mándale la petición. Si crees que una tabla no tiene RLS, consúltala con la clave anónima y mira qué devuelve.

Esto no es opcional ni es el paso final: es el punto 19 de la lista —*nunca la atacaste vos*— y es el que convierte una lista de sospechas en una lista de problemas. El manual de cómo atacar cada cosa está en `references/ataques.md`.

Cuando no puedas comprobarlo —porque hace falta producción, una clave que no tienes, o tocar datos reales— **dilo explícitamente y di qué comprobación falta**. Un "no verificado" honesto vale más que un CRÍTICO inventado.

## Cómo hacer la pasada

**Las 20 cosas que se olvidan están en `references/checklist.md`, con el comando concreto para este stack y cómo se arregla cada una.** Léelo antes de empezar. No es una lista para marcar casillas: es dónde mirar. Si el usuario pidió revisar algo puntual, ve directo a ese punto y no hagas la pasada entera.

**Ataca por capas, de afuera hacia adentro**, porque así es como entra alguien de verdad:

1. **Lo que está publicado** — el repo, el bundle que se descarga el navegador, las respuestas de la API. Aquí viven las claves filtradas, y una clave filtrada hace irrelevante todo lo demás.
2. **La puerta** — login, registro, recuperación de contraseña, el PIN de admin. Sin límite de intentos, la puerta más fuerte se abre a fuerza bruta.
3. **Lo que hay detrás de la puerta** — con una sesión de usuario normal, qué alcanzas que no deberías. Aquí viven el IDOR y las rutas de admin sin guardia, que son los dos agujeros más comunes de una app hecha a prisa.
4. **Lo que entra** — formularios, archivos, webhooks. Todo lo que viene de afuera y la app se cree.

**La pregunta correcta no es "¿está protegido?" sino "¿qué pasa si me salto la pantalla?".** Casi todo el código de esta app asume que la petición viene de su propia interfaz. Un atacante no usa la interfaz: usa `curl`. Un botón que no se dibuja no es un permiso, y una validación en React no es una validación.

**Supabase cambia el modelo mental y hay que tenerlo presente todo el tiempo.** El navegador habla directo con la base de datos usando la clave anónima, que es pública por diseño. Eso significa que **RLS no es una capa extra: es la única capa**. Una tabla sin RLS está abierta a cualquiera que abra las herramientas de desarrollador, aunque ninguna pantalla la muestre. Y al revés: `SUPABASE_SERVICE_ROLE_KEY` se salta RLS entera, así que cada sitio que la usa es un sitio donde tú escribes la autorización a mano — y donde se te puede olvidar.

**Prioriza por lo que se pierde, no por lo difícil que sea.** Un ataque trivial que expone los teléfonos de todos los usuarios es peor que uno sofisticado que borra un registro.

**Mira el registro de decisiones del final antes de reportar.** Hay cosas ya evaluadas. Volver a levantarlas sin que haya cambiado nada gasta la atención del usuario en algo que ya decidió.

## El blindaje

Esta habilidad no termina en el informe. Para cada hallazgo confirmado, **propón el arreglo concreto** —el `CREATE POLICY` que falta, la guardia que hay que añadir, la línea del `.env`— y ofrece aplicarlo.

Dos cosas que no se hacen nunca sin preguntar:

- **Rotar una clave.** Rompe producción en el momento en que lo haces. Dilo, explica el orden (rotar, desplegar, invalidar) y espera.
- **Cambiar RLS en producción.** Una política mal escrita deja fuera a usuarios legítimos y parece una caída. Propón la migración, explica qué deja de funcionar si está mal, y que el usuario decida cuándo.

Arregla primero lo que no se puede deshacer: una clave filtrada en el historial de git sigue filtrada aunque borres el archivo.

## Formato del informe

Empieza por el veredicto en una línea: si hay algo explotable hoy o no. El usuario lee eso y decide si sigue.

Después los hallazgos **ordenados por daño**, cada uno así:

```
[GRAVEDAD] Título que diga qué se puede hacer, no de qué tema es

Qué encontraste, con archivo:línea.
Cómo se explota — la petición concreta, y si la lanzaste o no.
Qué se lleva el atacante o qué rompe.
Cómo se arregla.
```

Gravedades, por lo que consigue el atacante:

- **CRÍTICO** — datos de todos los usuarios, control de admin, o dinero. Explotable sin cuenta o con una cuenta normal.
- **ALTO** — datos de otros usuarios concretos, o saltarse una regla de negocio que cuesta dinero.
- **MEDIO** — hace falta una condición poco común, o el daño es acotado.
- **BAJO** — endurecimiento. Nadie entra por ahí hoy, pero conviene cerrarlo.
- **NO VERIFICADO** — lo sospechas y no lo pudiste comprobar. Di qué falta para confirmarlo.

Cierra con dos secciones cortas:

- **Revisado y sin problema** — qué puntos miraste y están bien, para que "todo bien" no se confunda con "no lo miré".
- **Falsos positivos descartados** — lo que parecía y no era, con el porqué en una línea.

Si no hay nada explotable, dilo claro y sin inflar hallazgos menores para justificar la pasada. Una auditoría que siempre encuentra algo CRÍTICO deja de creerse.

## Después de la pasada

Cuando el usuario decida sobre un hallazgo —lo arregla, lo asume, o lo descarta— **añádelo al registro de abajo con la fecha y el motivo**. Eso es lo que hace que la décima pasada sea más útil que la primera en vez de la misma lista de siempre.

---

## Registro de decisiones ya tomadas

Cosas evaluadas, con su conclusión. No volver a levantarlas salvo que la premisa haya cambiado — y en ese caso, decir qué cambió.

**2026-10-02 · Firmas de webhooks de pago — VERIFICADO (lectura, sin atacar).**
`paypal/webhook` valida contra `/v1/notifications/verify-webhook-signature` de
PayPal, y `binance/webhook` usa `verifyBinanceWebhookSignature` con el esquema
RSA que Binance firma de verdad — un HMAC propio no servía y eso ya se corrigió.
Ambas rechazan con 401 si la firma no cuadra. **Falta comprobarlo atacando**:
mandar un webhook con firma inválida y otro repetido (replay) contra el entorno
de pruebas. Hasta que eso se haga, la idempotencia no está verificada, y el
historial del repo dice que ya hubo un fallo de doble acreditación de meses.

**2026-10-02 · Claves en el repo — LIMPIO en el árbol actual.**
`.gitignore` cubre `.env*.local` y lo único rastreado es `.env.example`.
**No se ha revisado el historial de git**, que es donde suelen quedar. Esa
comprobación sigue pendiente (punto 1 del checklist).

**2026-10-02 · Guardia de las rutas de admin — COMPLETA salvo una, a propósito.**
Las 33 rutas bajo `src/app/api/admin/` llaman a `checkAdminAuth()`. La única que
no es `security/logout`, que solo borra la cookie del PIN maestro: no lee ni
escribe datos, y exigir sesión para cerrar sesión no protege nada. **No es un
hallazgo.** Lo que sí queda pendiente es verificar que cada ruta comprueba
`user.isAdmin` y no solo que haya sesión, y que las acciones destructivas exigen
además la cookie `admin_master_ok`.

**2026-10-02 · Buckets de almacenamiento — CERRADOS (ver `auditoria-legal`).**
Los cinco buckets tienen lista blanca de 7 formatos de imagen, 5 MB (10 en
comprobantes) y `payment_receipts` es privado. `image/svg+xml` queda fuera a
propósito porque ejecuta scripts. No volver a levantarlo desde aquí.
