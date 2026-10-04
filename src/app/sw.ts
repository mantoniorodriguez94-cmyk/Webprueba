/**
 * El service worker de App Encuentra.
 *
 * Antes lo generaba next-pwa desde una lista de reglas en next.config.js.
 * next-pwa lleva sin mantenerse desde 2022 y arrastraba diez de las once
 * vulnerabilidades altas del proyecto, todas por su cadena de build
 * (workbox-build → rollup-plugin-terser → serialize-javascript, y
 * braces → micromatch → fast-glob). No se podían parchear sin cambiar de
 * herramienta: Serwist es su sucesor mantenido.
 *
 * Ahora el service worker es código del proyecto, con tipos, en vez de una
 * configuración que se traducía a código en algún sitio.
 */

import { defaultCache } from "@serwist/next/worker"
import {
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    /** La inyecta Serwist en el build con la lista de archivos a precachear. */
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  /* Las dos juntas son lo que hace que un despliegue LLEGUE. skipWaiting
     activa el service worker nuevo sin esperar a que se cierren las pestañas
     viejas; clientsClaim hace que tome el control de las que ya están
     abiertas. Sin ellas, una app instalada en el teléfono puede seguir
     sirviendo la versión anterior durante días. */
  skipWaiting: true,
  clientsClaim: true,

  navigationPreload: true,

  // El ruido de depuración no tiene nada que hacer en producción.
  disableDevLogs: true,

  runtimeCaching: [
    /* Va PRIMERO porque Serwist usa la primera regla que coincide, y la de
       "cross-origin" de defaultCache se llevaría esto si no.

       NetworkFirst y no StaleWhileRevalidate: son los datos de la app
       —negocios, mensajes, promociones, membresías—, y servir una copia vieja
       mientras se revalida significa enseñar un precio o un estado que ya
       cambió. El caché acá es la red de seguridad de cuando no hay señal, no
       la fuente habitual. */
    {
      matcher: /^https:\/\/.*\.supabase\.co\/.*$/i,
      handler: new NetworkFirst({
        cacheName: "supabase",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },

    /* El resto lo cubre el juego de reglas que mantiene Serwist: fuentes,
       imágenes, JS, CSS, los datos de Next y el resto de orígenes. Son más
       reglas y mejor afinadas que las cuatro que había escritas a mano, y
       sobre todo las mantiene alguien. */
    ...defaultCache,
  ],
})

serwist.addEventListeners()
