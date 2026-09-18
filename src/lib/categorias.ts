/**
 * Las categorías de negocio, en un solo sitio.
 *
 * Antes había DOS listas que no se hablaban: el alta guardaba texto libre
 * ("Ej: Panadería, Restaurante, Tienda...") y el filtro ofrecía once opciones
 * fijas que comparaba letra por letra. Un panadero escribía "Panadería" —el
 * ejemplo que le daba el propio formulario— y su negocio no aparecía bajo
 * ninguna categoría, ni siquiera bajo "Otros", porque "Otros" también
 * comparaba exacto. Encima el feed agrupaba por el valor crudo, así que
 * cualquier cosa tecleada se volvía una sección navegable del directorio: en
 * los datos reales llegó a haber categorías llamadas "ewfef" y "Hajja".
 *
 * Con una sola lista, lo que un negocio elige coincide siempre con lo que
 * alguien puede filtrar, por construcción.
 *
 * ── SE GUARDA EL `id`, NUNCA LA ETIQUETA ────────────────────────────────────
 *
 * En la base va `panaderia-dulceria`, no "Panadería y dulcería". Así renombrar
 * una categoría es cambiar una palabra acá, y no una migración en la que cada
 * fila mal convertida desaparece del filtro. Además quita de en medio las
 * tildes y las mayúsculas, que es justo donde fallaba la comparación anterior.
 *
 * Para mostrarla SIEMPRE se pasa por `etiquetaDeCategoria`. Si en una pantalla
 * se lee `business.category` a pelo, se verá el identificador.
 *
 * Hay además un CHECK en la base (scripts/categorias-cerradas.sql) con estos
 * mismos identificadores. Si se toca esta lista, hay que tocar el CHECK — un
 * valor válido que sólo vive en TypeScript acaba entrando por otro camino.
 */

export interface Categoria {
  /** Lo que se guarda en `businesses.category`. */
  id: string
  /** Lo que se le enseña a la gente. */
  label: string
  emoji: string
}

export const CATEGORIAS: readonly Categoria[] = [
  { id: "comida-restaurantes",  label: "Comida y restaurantes",     emoji: "🍽️" },
  { id: "panaderia-dulceria",   label: "Panadería y dulcería",      emoji: "🥐" },
  { id: "viveres-abastos",      label: "Víveres y abastos",         emoji: "🛒" },
  { id: "belleza",              label: "Belleza y cuidado personal", emoji: "💇" },
  { id: "salud",                label: "Salud",                     emoji: "💊" },
  { id: "ropa-calzado",         label: "Ropa y calzado",            emoji: "👕" },
  { id: "hogar-ferreteria",     label: "Hogar y ferretería",        emoji: "🔧" },
  { id: "servicios-hogar",      label: "Servicios para el hogar",   emoji: "🪛" },
  { id: "vehiculos-repuestos",  label: "Vehículos y repuestos",     emoji: "🚗" },
  { id: "tecnologia",           label: "Tecnología",                emoji: "💻" },
  { id: "educacion",            label: "Educación",                 emoji: "📚" },
  { id: "deportes",             label: "Deportes y gimnasios",      emoji: "🏋️" },
  { id: "mascotas",             label: "Mascotas",                  emoji: "🐾" },
  { id: "eventos",              label: "Eventos y fiestas",         emoji: "🎉" },
  { id: "otros",                label: "Otros",                     emoji: "📦" },
] as const

export const CATEGORIA_OTROS = "otros"

/** Valor del filtro que significa "no filtrar". No es una categoría. */
export const CATEGORIA_TODAS = "todas"

const POR_ID = new Map(CATEGORIAS.map((c) => [c.id, c]))

export function esCategoriaValida(id: string | null | undefined): boolean {
  return !!id && POR_ID.has(id)
}

/**
 * Nombre para mostrar. Un identificador desconocido se devuelve tal cual en
 * vez de convertirse en "Otros": si algún día entra un valor que no es de la
 * lista, es mejor verlo en pantalla y poder arreglarlo que esconderlo bajo una
 * etiqueta creíble.
 */
export function etiquetaDeCategoria(id: string | null | undefined): string {
  if (!id) return ""
  return POR_ID.get(id)?.label ?? id
}

export function emojiDeCategoria(id: string | null | undefined): string {
  if (!id) return "📦"
  return POR_ID.get(id)?.emoji ?? "📦"
}

/* Equivalencias para valores que no son identificadores: las once etiquetas
   viejas del filtro y algunos textos frecuentes. Al limpiar los negocios de
   prueba no quedó ninguna fila que convertir, así que esto no es una
   migración — es una red para lo que pueda llegar por el panel de admin o por
   un enlace antiguo con `?category=Restaurantes` guardado en favoritos. */
const EQUIVALENCIAS: Record<string, string> = {
  restaurantes: "comida-restaurantes",
  comida: "comida-restaurantes",
  panaderia: "panaderia-dulceria",
  pasteleria: "panaderia-dulceria",
  reposteria: "panaderia-dulceria",
  abastos: "viveres-abastos",
  bodega: "viveres-abastos",
  supermercado: "viveres-abastos",
  peluqueria: "belleza",
  barberia: "belleza",
  farmacia: "salud",
  ropa: "ropa-calzado",
  calzado: "ropa-calzado",
  ferreteria: "hogar-ferreteria",
  servicios: "servicios-hogar",
  taller: "vehiculos-repuestos",
  repuestos: "vehiculos-repuestos",
  tecnologia: "tecnologia",
  educacion: "educacion",
  deportes: "deportes",
  belleza: "belleza",
  salud: "salud",
  entretenimiento: "eventos",
  mascotas: "mascotas",
  veterinaria: "mascotas",
  tiendas: "otros",
  otros: "otros",
}

/** Quita tildes y mayúsculas para comparar. */
function aplanar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/**
 * Convierte cualquier valor en un identificador de la lista.
 * Devuelve null si viene vacío, y `otros` si no se reconoce.
 */
export function normalizarCategoria(valor: string | null | undefined): string | null {
  if (!valor || !valor.trim()) return null
  if (POR_ID.has(valor)) return valor

  const plano = aplanar(valor)
  if (POR_ID.has(plano)) return plano
  if (EQUIVALENCIAS[plano]) return EQUIVALENCIAS[plano]

  return CATEGORIA_OTROS
}
