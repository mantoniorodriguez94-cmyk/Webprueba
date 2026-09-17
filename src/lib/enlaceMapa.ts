/**
 * Sacar el punto del mapa de un enlace de Google Maps.
 *
 * Existe para que nadie tenga que escribir —ni leer— una latitud. Pegar el
 * enlace del local es algo que la gente ya sabe hacer; teclear dos números con
 * seis decimales, no. Ese era el motivo real de que ningún negocio tuviera
 * ubicación: el único camino disponible exigía estar parado dentro del local.
 */

export interface PuntoMapa {
  latitud: number
  longitud: number
}

/** Rango válido de la Tierra. Descarta un enlace mal copiado. */
function esPuntoRazonable(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    // 0,0 es el Golfo de Guinea: casi siempre significa "no se encontró nada".
    !(lat === 0 && lng === 0)
  )
}

/**
 * Formas en las que Google Maps mete el punto en la URL. Se prueban en orden
 * de fiabilidad: `!3d!4d` es el sitio EXACTO del lugar, mientras que `@` es
 * el centro de la vista, que puede estar algo corrido si la persona movió el
 * mapa antes de copiar.
 */
const PATRONES: RegExp[] = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,        // .../data=...!3d10.48!4d-66.90
  /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,     // ...?q=10.48,-66.90
  /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,    // ...?ll=10.48,-66.90
  /[?&]daddr=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ...?daddr=10.48,-66.90
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,             // .../@10.48,-66.90,17z
  /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/, // pegado a secas desde Maps
]

/** true si es uno de los enlaces cortos que no dicen dónde están. */
export function esEnlaceCorto(texto: string): boolean {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(texto)
}

export function puntoDesdeEnlace(texto: string | null | undefined): PuntoMapa | null {
  if (!texto || !texto.trim()) return null

  /* El enlace suele llegar con %2C en vez de comas cuando se copia desde
     ciertos navegadores. Decodificar primero evita fallar por eso. */
  let limpio = texto.trim()
  try {
    limpio = decodeURIComponent(limpio)
  } catch {
    /* Un % suelto rompe el decodificado; se sigue con el texto original. */
  }

  for (const patron of PATRONES) {
    const m = limpio.match(patron)
    if (!m) continue
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (esPuntoRazonable(lat, lng)) return { latitud: lat, longitud: lng }
  }

  return null
}
