/**
 * Sentry en el servidor: rutas de API, componentes de servidor, acciones.
 *
 * Sin DSN configurado, `init` no hace nada: el código queda inerte y no manda
 * ni un byte. Eso es a propósito — así el proyecto se puede clonar, levantar y
 * desplegar sin cuenta de Sentry, y se enciende el día que se pega la clave.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /* Los datos personales NO se mandan.
     Con esto en true, Sentry adjunta la IP, las cabeceras y el cuerpo de la
     petición a cada informe. Esta app guarda comprobantes de pago, chats y
     ubicaciones: un informe de error no tiene por qué llevarse nada de eso a
     un tercero. El stack y la URL bastan para arreglar el fallo, que es para
     lo que está. */
  sendDefaultPii: false,

  /* Sin trazas de rendimiento por ahora.
     Cada traza cuenta contra la cuota, y el problema que se quiere resolver es
     "no me entero de que algo se rompió", no "esta consulta tarda 300 ms". Se
     sube cuando haya tráfico que valga la pena medir. */
  tracesSampleRate: 0,

  /* En desarrollo se ve en la consola y no hace falta mandarlo: sólo gastaría
     cuota con errores que el desarrollador ya está viendo. */
  enabled: process.env.NODE_ENV === "production",
})
