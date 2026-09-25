/**
 * La web propia del negocio y sus redes sociales.
 *
 * App Encuentra no viene a reemplazar el sitio de nadie: da una ficha a quien
 * no tiene o no quiere tener uno, y a quien ya lo tiene le deja enlazarlo para
 * no perder la audiencia que ya se ganó. Por eso esto va en TODOS los planes,
 * gratis incluido, igual que el teléfono (ver viasDeContacto en
 * memberships/perks: "un escaparate sin puerta" es peor para la app que para
 * el negocio).
 *
 * Sólo Facebook, Instagram y TikTok. No es una lista que deba crecer sola: cada
 * red añadida es otro glifo compitiendo por la atención en una ficha que ya
 * tiene teléfono, WhatsApp, chat, ubicación y distancia.
 *
 * ── Por qué se valida el HOST y no sólo el formato ──────────────────────────
 *
 * El valor lo escribe el dueño del negocio, así que un botón con el glifo de
 * Instagram podría llevar a cualquier sitio. Se comprueba que el enlace de cada
 * red apunte de verdad al dominio de esa red: el glifo promete un destino y
 * tiene que cumplirlo. La web propia es libre por definición, pero ahí se exige
 * http(s), que es lo que impide un `javascript:` en un enlace que otros pulsan.
 */

export type RedSocial = "facebook" | "instagram" | "tiktok"

interface ConfigRed {
  etiqueta: string
  /** Dominios aceptados. Sin esto, el glifo puede mentir sobre su destino. */
  hosts: string[]
  /** Con qué se construye la URL cuando el dueño escribe sólo su usuario. */
  base: string
}

export const REDES: Record<RedSocial, ConfigRed> = {
  facebook: {
    etiqueta: "Facebook",
    hosts: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "fb.me"],
    base: "https://facebook.com/",
  },
  instagram: {
    etiqueta: "Instagram",
    hosts: ["instagram.com", "www.instagram.com"],
    base: "https://instagram.com/",
  },
  tiktok: {
    etiqueta: "TikTok",
    hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
    base: "https://tiktok.com/@",
  },
}

/** Sólo http y https. Cualquier otro esquema es un enlace que no debe existir. */
function urlSegura(valor: string): URL | null {
  try {
    const url = new URL(valor)
    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

/**
 * Deja el sitio web en una URL utilizable, o null.
 *
 * Acepta que lo escriban sin esquema —"minegocio.com" es lo que la gente
 * teclea— y asume https. No acepta otra cosa que http o https.
 */
export function normalizarWeb(valor: string | null | undefined): string | null {
  const limpio = (valor ?? "").trim()
  if (!limpio) return null

  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(limpio) ? limpio : `https://${limpio}`
  const url = urlSegura(conEsquema)
  if (!url) return null

  // Un host sin punto no es un dominio: descarta "localhost" y los dedazos.
  if (!url.hostname.includes(".")) return null

  return url.toString()
}

/**
 * Deja una red social en su URL canónica, o null.
 *
 * Acepta las tres formas en que se escribe esto en la vida real: el usuario a
 * secas, el usuario con arroba, o la URL completa copiada del navegador.
 */
export function normalizarRed(red: RedSocial, valor: string | null | undefined): string | null {
  const limpio = (valor ?? "").trim()
  if (!limpio) return null

  const config = REDES[red]

  // Si parece una dirección, tiene que apuntar al dominio de ESA red.
  if (/^[a-z][a-z0-9+.-]*:/i.test(limpio) || limpio.includes("/")) {
    const url = urlSegura(/^[a-z][a-z0-9+.-]*:/i.test(limpio) ? limpio : `https://${limpio}`)
    if (!url) return null
    if (!config.hosts.includes(url.hostname.toLowerCase())) return null
    return url.toString()
  }

  // Si no, es un usuario suelto.
  const usuario = limpio.replace(/^@+/, "")
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(usuario)) return null

  return `${config.base}${usuario}`
}

/**
 * Lo que se pinta en el botón: el usuario, no la URL entera.
 * "@panaderiayahu" se lee; "https://instagram.com/panaderiayahu" no cabe.
 */
export function etiquetaDeRed(red: RedSocial, url: string): string {
  try {
    const usuario = new URL(url).pathname.replace(/^\/+|\/+$/g, "").replace(/^@/, "")
    return usuario ? `@${usuario}` : REDES[red].etiqueta
  } catch {
    return REDES[red].etiqueta
  }
}

/** El dominio, para mostrarlo en el botón de la web en vez de la URL cruda. */
export function dominioVisible(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * Última comprobación antes de pintar un enlace.
 *
 * Se valida al guardar, pero también acá: las filas que ya están en la base se
 * escribieron antes de que existiera la validación, y una ficha pública no es
 * sitio para confiar en que el dato de ayer estaba limpio.
 */
export function enlaceRenderizable(url: string | null | undefined): string | null {
  if (!url) return null
  return urlSegura(url.trim()) ? url.trim() : null
}
