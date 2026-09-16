import type { Metadata } from "next"

/**
 * Los datos que identifican al sitio ante buscadores y redes, en un solo sitio.
 *
 * Vivían sueltos: el host estaba escrito a mano en el layout, en robots, en el
 * respaldo del sitemap y en el de las fichas de negocio, y cada copia podía
 * quedarse atrás. De hecho se quedaron: durante un tiempo todas anunciaban el
 * dominio pelado mientras Vercel servía el que lleva www, así que la app
 * declaraba una URL distinta de la que respondía. Con una sola definición ese
 * desacuerdo no puede volver a ocurrir.
 */

/** Host canónico, CON www: es el que Vercel sirve de verdad. */
export const SITIO = "https://www.appencuentra.com"

export const NOMBRE_SITIO = "App Encuentra"

/** Tarjeta de vista previa por defecto, 1200x630. */
export const IMAGEN_OG = "/brand/og.png"

interface PaginaPublica {
  title: string
  description: string
  /** Ruta absoluta dentro del sitio, con barra inicial. Ej: "/terminos" */
  path: string
}

/**
 * Metadatos completos para una página pública indexable.
 *
 * Existe por cómo Next fusiona los metadatos: hereda del layout raíz hacia
 * abajo, pero campo por campo y de forma superficial. Una página que declare
 * `openGraph` REEMPLAZA el del layout entero, no lo completa — así que poner
 * sólo la `url` para corregirla se llevaba por delante el nombre del sitio, la
 * imagen y el idioma, y la vista previa quedaba peor que antes.
 *
 * Por eso cada página devuelve el bloque entero, y para que no haya tres
 * copias del bloque entero, se arma acá.
 *
 * `url` y `canonical` van absolutas a propósito: son justamente las dos que
 * tienen que nombrar el host sin ambigüedad.
 */
export function metadatosDePaginaPublica({
  title,
  description,
  path,
}: PaginaPublica): Metadata {
  const url = `${SITIO}${path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "es_VE",
      url,
      siteName: NOMBRE_SITIO,
      title,
      description,
      images: [{ url: IMAGEN_OG, width: 1200, height: 630, alt: NOMBRE_SITIO }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [IMAGEN_OG],
    },
  }
}
