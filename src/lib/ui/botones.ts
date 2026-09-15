/**
 * Las clases de los botones de contacto, en un solo sitio.
 *
 * Estaban escritas a mano en tres pantallas —la tarjeta del feed, la ficha del
 * panel y la página pública— y las tres habían derivado por su cuenta: una
 * usaba un degradado verde con shadow-lg, otra un degradado distinto, la
 * tercera un verde plano, y cada una un radio y un tamaño diferentes.
 *
 * Peor que la disparidad: las tres ponían DOS campos saturados juntos, lo que
 * contradice la regla cardinal que declara tailwind.config —"un solo color
 * saturado en pantalla, `blue`, reservado a la acción principal"— y su nota
 * sobre el verde, que es semántico (activo, verificado, en línea) y que "si
 * aparece en un botón, tarjeta o barra grande, es un error".
 *
 * Por eso esto es un módulo y no tres copias arregladas: el próximo cambio de
 * jerarquía se hace una vez.
 *
 * El TAMAÑO sí cambia entre pantallas y está bien que cambie —una acción
 * dentro de una tarjeta de lista no pide lo mismo que la de una ficha
 * completa—; lo que no puede cambiar es el papel de cada color.
 */

type Variante =
  /** La acción principal. Sólo UNA por pantalla: es el único campo saturado. */
  | "primario"
  /** WhatsApp. Verde como acento, nunca como losa: el glifo ya lo identifica. */
  | "whatsapp"
  /** Lo secundario: neutro, presente pero sin disputar la atención. */
  | "secundario"
  /** Apagado, para lo que existe pero no está disponible en este plan. */
  | "deshabilitado"

type Tamano =
  /** Dentro de una tarjeta de lista. */
  | "compacto"
  /** En una ficha o página completa. */
  | "normal"

const BASE = "inline-flex items-center justify-center gap-2 font-semibold transition-colors"

const TAMANOS: Record<Tamano, string> = {
  compacto: "text-sm py-2.5 px-4 rounded-2xl",
  normal: "py-3 px-6 rounded-full",
}

const VARIANTES: Record<Variante, string> = {
  primario: "bg-blue-500 hover:bg-blue-600 text-white shadow-sm",
  whatsapp: "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200",
  secundario: "bg-black/[0.04] hover:bg-black/[0.07] text-ink-2 hover:text-ink",
  deshabilitado: "bg-black/5 text-ink-2 border border-black/8 opacity-60 cursor-not-allowed",
}

export function claseBoton(
  variante: Variante,
  tamano: Tamano = "normal",
  extra = ""
): string {
  return [BASE, TAMANOS[tamano], VARIANTES[variante], extra].filter(Boolean).join(" ")
}
