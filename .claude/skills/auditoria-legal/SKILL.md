---
name: auditoria-legal
description: Audita App Encuentra buscando riesgos legales, de licencias y de cumplimiento — uso de APIs y mapas de terceros (Google Maps, OpenStreetMap), pasarelas de pago (PayPal, Binance Pay), datos personales y geolocalización, exposición de datos sensibles (comprobantes de pago, claves, RLS), correo masivo y consentimiento, marca registrada, y coherencia entre lo que prometen los Términos y la Política de Privacidad frente a lo que la app hace de verdad. Úsala siempre que el usuario pregunte si algo "viola", "infringe", "es legal", "hay que pagar licencia", "estamos cumpliendo", si puede usar cierto servicio o dato de terceros, antes de lanzar o de integrar una API nueva, o cuando pida una revisión de cumplimiento, riesgos legales o auditoría del proyecto — aunque no use la palabra "auditoría".
---

# Auditoría legal y de cumplimiento — App Encuentra

Esta habilidad busca una cosa concreta: **lo que puede costarle dinero, una cuenta cerrada o una demanda al proyecto**, y que hoy esté en el código sin que nadie lo haya decidido a conciencia.

No es una revisión de seguridad ni de calidad. Si encuentras un bug, anótalo aparte y sigue.

## Por qué esta habilidad existe

App Encuentra toca cuatro cosas que casi siempre generan obligaciones: **cobra dinero**, **guarda datos personales**, **publica contenido de terceros** y **usa servicios de otras empresas**. Cada una tiene reglas, y las reglas se rompen sin querer — normalmente al añadir una integración nueva o al escribir una promesa en los Términos que el código no cumple.

El riesgo más caro de este proyecto no es una multa: es que **Supabase, PayPal o Binance cierren la cuenta**. Eso apaga el producto entero en un día. Priorízalo en consecuencia.

## Cómo hacer la pasada

**Busca evidencia en el código, no supongas.** Un hallazgo sin una línea de archivo detrás es una opinión, y las opiniones generan ruido que hace que la próxima auditoría se ignore. Si sospechas algo pero no lo puedes demostrar, dilo como sospecha y explica qué habría que comprobar.

**Distingue tres cosas, y no las mezcles:**

- **Riesgo real** — hay una obligación concreta y el código no la cumple.
- **Depende de cómo crezca** — hoy no pasa nada; a cierto volumen o con cierto cambio, sí. Di cuál es el umbral.
- **Falso positivo** — parece riesgoso y no lo es. Explica por qué, porque si no volverá a aparecer en cada auditoría.

**Mira el registro de decisiones antes de reportar.** Al final de este archivo hay cosas ya evaluadas y aceptadas. Si vuelves a levantarlas sin que haya cambiado nada, estás gastando la atención del usuario en algo que ya decidió.

**Cuando cambies de opinión sobre algo del registro, dilo explícitamente.** Que una decisión esté anotada no la vuelve correcta para siempre: el código cambia debajo. Si la premisa de una decisión ya no se sostiene, ese es un hallazgo de primera.

Las siete áreas y qué mirar en cada una están en `references/areas.md`. Léelo antes de empezar: tiene los comandos de búsqueda concretos y, para cada área, qué distingue el riesgo real del falso positivo.

## Los límites de lo que puedes afirmar

No eres abogado y el usuario lo sabe, así que no hace falta repetirlo en cada hallazgo — una vez al final basta. Lo que sí importa:

- **Los términos de terceros cambian.** Lo que sabes tiene fecha. Cuando un hallazgo dependa de la letra pequeña de Google, PayPal o Binance, dilo y señala dónde confirmarlo.
- **La ley depende del país.** El proyecto es venezolano, la empresa está registrada en Texas y los servicios son estadounidenses. Cuando eso importe, nómbralo en vez de dar una respuesta genérica.
- **No inventes números.** Si no sabes el precio de una API o el umbral exacto de un plan gratuito, di que hay que consultarlo. Un número inventado es peor que ninguno.

## Formato del informe

Empieza por el veredicto en una línea: si hay algo urgente o no. El usuario suele leer eso y decidir si sigue.

Después, los hallazgos **ordenados por lo que cuesta si sale mal**, no por área ni por facilidad de arreglo. Cada uno con:

```
[GRAVEDAD] Título en una frase, que diga el problema y no el tema

Qué encontraste, con archivo:línea.
Qué obligación se está incumpliendo y de quién es esa obligación.
Qué pasa si nadie lo arregla — concreto, no "podría haber problemas".
Cómo se arregla.
```

Gravedades: **CRÍTICO** (puede cerrar una cuenta o parar el producto), **ALTO** (obligación incumplida con consecuencia probable), **MEDIO** (hay que arreglarlo, sin urgencia), **VIGILAR** (depende de cómo crezca — di el umbral).

Cierra con dos secciones cortas:

- **Revisado y sin problema** — las áreas que miraste y están bien. Sirve para que el usuario sepa qué cubriste, y para que un "todo bien" no se confunda con "no lo miré".
- **Falsos positivos descartados** — lo que parecía y no era, con el porqué en una línea.

Si no encuentras nada grave, dilo claramente y sin inflar hallazgos menores para justificar la pasada. Una auditoría que siempre encuentra algo grave deja de creerse.

## Después de la pasada

Cuando el usuario decida sobre un hallazgo —lo arregla, lo asume, o lo descarta— **añádelo al registro de abajo con la fecha y el motivo**. Ese registro es lo que hace que la décima auditoría sea más útil que la primera en vez de la misma lista de siempre.

---

## Registro de decisiones ya tomadas

Cosas evaluadas, con su conclusión. No volver a levantarlas salvo que la premisa haya cambiado — y en ese caso, decir qué cambió.

**2026-09-17 · Buckets de almacenamiento — cerrados, ARREGLADO.**
`logos` y `negocios-gallery` eran públicos, sin límite de tamaño y aceptaban
cualquier tipo de archivo. Los cinco buckets quedan con la misma lista: 7
formatos de imagen, 5 MB (10 MB en comprobantes), y `payment_receipts` sigue
privado. **image/svg+xml queda fuera a propósito**: es el único formato de
imagen que puede llevar script y ejecutarlo al servirse desde el dominio.
Verificado subiendo un SVG con `<script>` — devuelve 415.

Lo que NO hay que perder de vista: el candado vive sólo en el bucket. El
`accept="image/*"` del formulario es una sugerencia del navegador y ni siquiera
excluye SVG, y `comprimirImagen` devuelve intacto lo que no sabe convertir —
es un paso-a-través para los HEIC, no una defensa, y además sólo se usa en la
pantalla de galería. Si alguien añade un bucket nuevo, hay que darle esta misma
lista o nace abierto.

**2026-09-17 · Enlaces a Google Maps — sin riesgo, no repetir.**
`BusinessLocation.tsx` arma `https://www.google.com/maps?q=lat,lng` y abre pestaña nueva. Es un enlace a una web pública, no Google Maps Platform: sin clave, sin cuota, sin facturación. Google documenta este uso (Google Maps URLs) como la forma oficial de abrir Maps sin la API. **La premisa cambia** si aparece una clave de API, un mapa de Google incrustado, o uso de Places, Geocoding o Directions.

**2026-09-17 · Las coordenadas son propias, no de Google.**
Salen de `navigator.geolocation` (GPS del dispositivo) en `UbicacionModal.tsx` y `useUserLocation.ts`. Por eso no les aplican las restricciones de almacenamiento que Google impone a los datos obtenidos de sus APIs. **Esto se pierde** el día que se use autocompletado de direcciones o geocodificación de Google: a partir de ahí las coordenadas serían suyas y con condiciones. Es una razón fuerte para no integrarlo.

**2026-09-17 · Tiles de OpenStreetMap — a vigilar, no es problema hoy.**
`UbicacionModal.tsx` incrusta `openstreetmap.org/export/embed.html`. Los servidores de OSM son infraestructura donada con una política que desaconseja el uso en producción con tráfico real. Hoy se abre en un modal ocasional y no llama la atención de nadie. **El umbral**: poner un mapa en cada ficha de negocio o en el feed. Ahí haría falta un proveedor de tiles de pago. El dato de OSM es gratis; lo que se paga es servir las imágenes.

**2026-09-17 · No mandar al dueño del negocio a Google Maps — decisión de negocio, no legal.**
Se descartó ofrecerle buscar su local en Google Maps porque es enseñarle un producto que ya hace lo que él quiere vender. No tiene nada que ver con licencias; anotado para que una auditoría no lo proponga como "solución".
