/**
 * Sentry en el navegador.
 *
 * Next carga este archivo antes de que arranque la aplicación del cliente, así
 * que cubre también los errores que ocurren durante el montaje inicial — los
 * que de otro modo dejarían la pantalla en blanco sin que nada los registre.
 *
 * Mismo criterio que en el servidor: sin DSN no hace nada, no manda datos
 * personales, y en desarrollo está apagado.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === "production",

  /* Sin grabación de sesión (Session Replay), a propósito y por dos motivos.
     Pesa bastante en el paquete que descarga cada visitante, y esta app se usa
     desde teléfonos con datos móviles en Venezuela. Y graba la pantalla: en
     una app con chats, comprobantes de pago y ubicaciones, eso es exactamente
     lo que no queremos mandarle a un tercero. */
  integrations: [],
})

/* Next exige exportar este hook para instrumentar las navegaciones del
   enrutador. Hoy no hace trabajo real —las trazas están en 0— pero se exporta
   igual: sin él el SDK avisa en cada build, y esos avisos son los que hacen
   que un día dejemos de leer la salida del build. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
