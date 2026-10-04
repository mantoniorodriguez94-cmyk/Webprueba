/** @type {import('next').NextConfig} */

/* ── PWA: Serwist ──────────────────────────────────────────────────────────
 *
 * Reemplaza a next-pwa, abandonado desde 2022 y responsable de diez de las
 * once vulnerabilidades altas que arrastraba el proyecto —todas en su cadena
 * de build, no en código que corre en producción, pero imposibles de parchear
 * sin cambiar de herramienta—.
 *
 * Las reglas de caché ya no viven acá: ahora son código con tipos en
 * src/app/sw.ts, que es lo que Serwist compila a public/sw.js.
 *
 * El archivo pasó de .js a .mjs porque @serwist/next sólo se publica como
 * ESM y no se puede `require`. Lo único que cambia por eso es la forma de
 * importar Sentry y de exportar; la configuración es la misma.
 *
 * Se deja SIN cacheOnNavigation a propósito. next-pwa guardaba las páginas 24
 * horas con una regla atrapatodo y caía al caché si la red tardaba más de 10
 * segundos, que es exactamente cómo la app instalada en el teléfono siguió
 * mostrando una versión vieja durante días después de desplegar un arreglo.
 * Para un directorio que se consulta en vivo, una página siempre fresca vale
 * más que una página disponible sin conexión.
 */
import withSerwistInit from "@serwist/next"
import { withSentryConfig } from "@sentry/nextjs/config"

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // En desarrollo estorba: cachea mientras uno edita.
  disable: process.env.NODE_ENV === "development",
})

/* Cabeceras de seguridad.
 *
 * Vercel sólo manda HSTS por su cuenta; el resto no las enviaba nadie. Van
 * acá y no en el middleware porque el middleware no corre para archivos
 * estáticos ni para /api, y estas tienen que ir en TODA respuesta.
 *
 * Lo que NO está todavía: una CSP de contenido completa (script-src,
 * style-src, connect-src...). Esa hay que armarla con la lista exacta de
 * orígenes que carga la app —PayPal, Supabase, Google Fonts, OpenStreetMap—
 * y probarla contra el flujo de pago real antes de activarla, porque una
 * directiva de más deja la pasarela muerta sin avisar. La `frame-ancestors`
 * de abajo sí es segura: sólo dice quién puede embebernos, no restringe nada
 * de lo que cargamos.
 */
const CABECERAS_SEGURIDAD = [
  {
    // El navegador respeta el Content-Type declarado en vez de adivinarlo.
    // Sin esto, un archivo subido por un usuario puede acabar ejecutándose
    // como si fuera otra cosa.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Al salir del sitio se manda el origen, no la URL completa: una ficha
    // con identificadores en la ruta deja de filtrarse al sitio de destino.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Nadie puede meter la app dentro de un iframe ajeno para superponerle
    // botones invisibles y robar clics (clickjacking). Ninguna página
    // nuestra se embebe a sí misma, así que no rompe nada.
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    // Lo mismo que la anterior, en la forma moderna que sí entienden los
    // navegadores actuales. Se mandan las dos porque cada una cubre
    // versiones distintas.
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'",
  },
  {
    // Cámara y micrófono no se usan en ninguna pantalla: se niegan del todo.
    // La ubicación SÍ —siete pantallas la piden, incluido el alta de un
    // negocio—, así que se permite, pero sólo a nuestro propio origen.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: CABECERAS_SEGURIDAD,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

/* ── Sentry ────────────────────────────────────────────────────────────────
 *
 * Envuelve por fuera de withPWA porque necesita ver la configuración ya
 * resuelta para inyectar el plugin que sube los mapas de código.
 *
 * Los mapas de código son lo que convierte un informe inútil —"error en
 * chunk-4f2a.js línea 1, columna 28470"— en uno que dice archivo y línea de
 * TU código. Se suben a Sentry en el build y NO se publican al navegador, así
 * que no exponen el fuente a nadie.
 *
 * Sin SENTRY_AUTH_TOKEN el plugin se salta esa subida y el build sigue
 * adelante: el proyecto se puede compilar sin cuenta de Sentry.
 */
export default withSentryConfig(withSerwist(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Que el build no se llene de avisos del plugin cuando no hay token.
  silent: !process.env.CI,

  // No publicar los mapas de código al navegador: van a Sentry y se borran.
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  /* Rutea los informes del navegador por nuestro propio dominio.
     Sin esto, los bloqueadores de anuncios —que mucha gente lleva puesto—
     bloquean la petición a Sentry y el error se pierde justo en los usuarios
     que más raro tienen el navegador, que son los que más fallos encuentran. */
  tunnelRoute: "/monitoring",

  /* Quita de la compilación los mensajes de depuración del propio SDK. Antes
     era `disableLogger`, obsoleto desde la v10. */
  webpack: { treeshake: { removeDebugLogging: true } },

});

