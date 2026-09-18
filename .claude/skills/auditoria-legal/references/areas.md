# Las siete áreas

Cada una trae: qué buscar, cómo buscarlo, y qué separa el riesgo real del falso positivo.

El orden no es casual — está por lo que cuesta si sale mal. Si no hay tiempo para todo, las tres primeras son las que pueden apagar el producto.

## Índice

1. [Pagos y pasarelas](#1-pagos-y-pasarelas)
2. [Datos sensibles expuestos](#2-datos-sensibles-expuestos)
3. [Datos personales y privacidad](#3-datos-personales-y-privacidad)
4. [Lo que prometen los textos legales](#4-lo-que-prometen-los-textos-legales)
5. [Correo y consentimiento](#5-correo-y-consentimiento)
6. [Servicios y licencias de terceros](#6-servicios-y-licencias-de-terceros)
7. [Contenido publicado y marca](#7-contenido-publicado-y-marca)

---

## 1. Pagos y pasarelas

Lo más caro del proyecto. Una cuenta de PayPal congelada no es una multa: es que deja de entrar dinero mientras se resuelve.

**Qué buscar**

```bash
grep -rn "api-m.paypal.com\|api-m.sandbox\|PAYPAL_\|BINANCE_PAY" src/ .env.example
grep -rn "card\|tarjeta\|cvv\|card_number" src/ --include="*.ts*" -i
```

- **Datos de tarjeta tocando el servidor.** Si algún campo, log o tabla guarda número de tarjeta, CVV o fecha de vencimiento, eso es PCI-DSS y es CRÍTICO. Lo correcto es que la tarjeta no pase nunca por el código propio: la pasarela la recoge en su iframe o redirección.
- **Comprobantes de pago manual.** Son capturas con nombres, números de cuenta y a veces cédula. Son datos personales de terceros. Ver área 2.
- **La devolución prometida vs la real.** Los Términos dicen algo sobre reembolsos; comprueba que exista de verdad una forma de hacerlo. Prometer una política de devolución que no se puede ejecutar es un problema con la pasarela, no solo con el cliente.
- **Binance Pay exige cuenta de comerciante registrada** (Entity Merchant). Si las credenciales están vacías, la integración no está activa y no hay riesgo — pero tampoco funciona. Distingue "no configurado" de "configurado mal".
- **Suscripciones recurrentes.** Si en algún momento se cobra automáticamente cada mes, aparecen obligaciones de aviso previo y cancelación fácil. Si el cobro es manual y puntual, no.

**Falso positivo típico**: que la URL de PayPal sea la de producción y no la de pruebas. Eso es una decisión de despliegue, no una infracción.

---

## 2. Datos sensibles expuestos

**Qué buscar**

```bash
grep -rn "SERVICE_ROLE\|service_role" src/ | grep -v "src/app/api\|src/lib/supabase\|src/utils"
grep -rln "\"use client\"" src/ | xargs grep -ln "SERVICE_ROLE" 2>/dev/null
grep -rn "NEXT_PUBLIC_" src/ .env.example | grep -iE "secret|key|password|token|pin"
```

- **La clave de servicio en el cliente.** `SUPABASE_SERVICE_ROLE_KEY` salta todas las políticas de la base. Si aparece en un archivo con `"use client"`, o en una variable que empiece por `NEXT_PUBLIC_`, es CRÍTICO y no admite matiz: cualquiera con el navegador abierto tiene la base entera.
- **El bucket de comprobantes.** `payment_receipts` tiene que ser privado. Si estuviera público, las capturas de transferencia de todos los clientes serían accesibles con la URL. Comprobable desde la API de Supabase listando los buckets.
- **Buckets sin límite de tamaño ni de tipo.** Permite subir cualquier cosa, incluido un SVG con script dentro servido desde el dominio de almacenamiento.
- **RLS activado, no solo políticas escritas.** Una política sobre una tabla con RLS apagado no da error y no se aplica nunca. Es el fallo silencioso más común. Comprobar `relrowsecurity` en `pg_class`, no solo la existencia de la política.
- **Secretos en el historial de git.** Si un `.env` estuvo commiteado alguna vez, la clave sigue ahí aunque el archivo ya no exista.

**Falso positivo típico**: la clave de servicio usada dentro de `src/app/api/**` o de un componente de servidor. Ahí es correcta y necesaria.

---

## 3. Datos personales y privacidad

**Qué buscar**

```bash
grep -rn "getCurrentPosition\|watchPosition" src/
grep -rn "sessionStorage\|localStorage" src/ --include="*.ts*"
grep -rn "searchParams.set\|params.set" src/ --include="*.ts*"
```

- **Geolocalización sin contexto.** Pedir la ubicación al cargar la página, sin que la persona haya pedido nada, es mala práctica y en algunas jurisdicciones un problema de consentimiento. Pedirla al pulsar un botón que explica qué se gana, no.
- **Datos personales en la URL.** Las URLs quedan en el historial, en los registros del servidor y en el `Referer` que se manda a terceros. La ubicación de una persona, su correo o su identificador no van ahí nunca.
- **Cuánto se guarda y por cuánto tiempo.** Si la ubicación de quien navega se guarda solo en la sesión del navegador y no se envía a ningún sitio, el riesgo es mínimo y conviene decirlo en la política. Si se guardara en la base asociada a la cuenta, cambia todo.
- **Menores.** Si el registro no pregunta la edad y el servicio no está dirigido a menores, normalmente basta con decirlo en los Términos. Comprobar que lo diga.
- **Terceros que reciben datos.** Cada servicio externo que recibe datos de usuarios (correo, pagos, analítica) debería estar nombrado en la política de privacidad. Si se añade uno nuevo y la política no se actualiza, eso es un hallazgo.

**Falso positivo típico**: guardar coordenadas del negocio. Un negocio publicado en un directorio es información comercial pública, no un dato personal protegido.

---

## 4. Lo que prometen los textos legales

Esta es el área que más hallazgos reales da, y la que casi nadie mira: **los Términos y la Política de Privacidad prometen cosas, y el código tiene que poder cumplirlas.**

**Qué hacer**

Lee `src/app/(public)/terminos/page.tsx` y `privacidad/page.tsx` enteros. Por cada promesa concreta, busca el mecanismo en el código. Ejemplos del tipo de cosa que aparece:

- «Puede solicitar la eliminación de su cuenta y datos» → ¿existe una forma de pedirlo? ¿Y de ejecutarlo? Un correo de soporte puede bastar si alguien lo atiende; no basta si nadie puede borrar nada.
- «Nos reservamos el derecho de suspender cuentas» → ¿suspender hace algo de verdad?
- «Los datos se conservan X tiempo» → ¿hay algo que borre al cumplirse el plazo?
- «Publicamos fichas de comercios elaboradas por nuestro equipo, sin solicitud previa» → esto tiene implicaciones: datos de un negocio que no pidió estar, y un camino para reclamar o retirarse.
- Nombre de la empresa, jurisdicción y datos de contacto: que coincidan con la realidad y entre ambos documentos.

**Por qué importa más de lo que parece**: una promesa incumplida en un documento legal es peor que no haber prometido nada. Es la prueba escrita de que se sabía.

---

## 5. Correo y consentimiento

**Qué buscar**

```bash
grep -rn "resend.emails.send\|sendEmail\|broadcast" src/ --include="*.ts*"
```

- **Distingue transaccional de comercial.** Un correo de confirmación, recuperación de contraseña o aviso de mensaje nuevo es transaccional: no necesita baja. Un envío masivo con novedades o promociones es comercial, y ahí la baja es obligatoria en casi todas partes (CAN-SPAM en Estados Unidos, donde está registrada la empresa).
- **Si existe una ruta de envío masivo**, mírala con atención: ¿a quién le manda, con qué criterio, y lleva forma de darse de baja? Un `broadcast` a todos los usuarios sin enlace de baja es un hallazgo ALTO.
- **Dominio del remitente verificado.** Sin SPF y DKIM, el correo acaba en spam o rebota. No es ilegal, pero rompe el flujo de recuperación de contraseña, que sí es una promesa del producto.
- **Correos a direcciones que no se registraron.** Cualquier ruta que acepte un destinatario arbitrario y mande correo es un relé abierto: quema la cuota y mete el dominio en listas negras.

---

## 6. Servicios y licencias de terceros

**Qué buscar**

```bash
grep -rn "googleapis\|google.com/maps\|mapbox\|openstreetmap\|unsplash" src/ next.config.js
grep -rn "fonts.googleapis\|next/font" src/
```

- **Enlazar no es integrar.** Un enlace a una web pública no consume API ni licencia. Incrustar un mapa, pedir datos de lugares, geocodificar o calcular rutas, sí — y eso exige clave, cuenta de facturación y aceptar sus términos. La diferencia entre ambas cosas es la que decide si hay que pagar.
- **Tiles de mapa.** El dato de OpenStreetMap es libre (ODbL, con atribución obligatoria); servir las imágenes es lo que cuesta. Los servidores públicos de OSM son donados y su política pide no usarlos en producción con tráfico real.
- **Imágenes de terceros.** Revisa qué dominios remotos se permiten en `next.config.js`. Usar fotos de un banco de imágenes en producción tiene condiciones distintas a usarlas en una maqueta.
- **Tipografías.** Las de Google Fonts son libres; `next/font` además las sirve desde el propio dominio, que es mejor también para privacidad. Si apareciera una tipografía comercial, tiene licencia.
- **Licencias de las dependencias.** Lo habitual en npm es MIT o Apache y no da problemas. Lo que hay que detectar es una copyleft fuerte (GPL, AGPL) entrando en un producto cerrado.

**Falso positivo típico**: mencionar "Google Maps" por su nombre en un enlace. Referirse a un servicio por su nombre es normal; lo que tiene reglas es usar su logo o dar a entender una asociación.

---

## 7. Contenido publicado y marca

- **Fichas de negocios creadas sin que el negocio lo pida.** Es una práctica común en directorios y suele ser defendible con información pública, pero necesita dos cosas: un camino claro para reclamar la ficha y otro para pedir que se retire.
- **Reseñas de usuarios.** El contenido lo escribe un tercero. Hace falta una vía para denunciar una reseña difamatoria y una política de moderación — y que la moderación exista de verdad en el panel, no solo en el texto legal.
- **Fotos subidas por los usuarios.** Los Términos deberían decir que quien sube declara tener derecho a la imagen, y que concede permiso para mostrarla.
- **Nombres y logos ajenos.** Si la app muestra marcas de terceros (pasarelas, servicios), usarlas para identificar el servicio es correcto; sugerir patrocinio o asociación no.
- **El nombre propio.** Comprobar que el nombre comercial y el de la entidad registrada se usen de forma coherente y que coincidan con lo que dicen los documentos legales.
