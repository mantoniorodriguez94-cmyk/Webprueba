/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        },
        networkTimeoutSeconds: 10,
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 días
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|otf|eot)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
        }
      }
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        },
        networkTimeoutSeconds: 10,
      }
    }
  ]
});

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

module.exports = withPWA(nextConfig);

