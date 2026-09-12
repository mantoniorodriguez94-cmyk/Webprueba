"use client"

/**
 * Encabezado de las secciones del dashboard.
 *
 * Cada pantalla armaba el suyo, y con el tiempo divergieron en tres ejes a la
 * vez: el ancho máximo (7xl, 5xl, 4xl), el alto (py-3 en una, py-4 en el
 * resto) y el vidrio (bg-white/80 blur-md contra bg-white/85 blur-xl). El
 * resultado era que la barra superior cambiaba de tamaño al cambiar de
 * sección, que es exactamente lo que un encabezado no debe hacer.
 *
 * Alineado a la izquierda a propósito: el título centrado obligaba a poner un
 * espaciador invisible del otro lado para compensar, y bastaba con quitar un
 * botón para que el centrado se rompiera.
 */

import type { ReactNode } from "react"

interface SectionHeaderProps {
  titulo: string
  subtitulo?: string
  /** Ícono a la izquierda del título. */
  icono?: ReactNode
  /** Acciones a la derecha: un badge, un menú, un botón. */
  acciones?: ReactNode
  /**
   * Ancho máximo del contenido. Debe coincidir con el del `main` de la página
   * o el título queda desalineado respecto al contenido en escritorio. En
   * móvil no cambia nada: ahí todo ocupa el ancho completo.
   */
  ancho?: "5xl" | "7xl" | "feed"
  /**
   * Acción de volver, para pantallas anidadas. Las secciones que son destino
   * de la barra inferior no la usan: ahí la barra ya es la navegación.
   */
  onVolver?: () => void
}

/* Incluyen el padding lateral, no sólo el ancho, porque el encabezado tiene
   que alinearse con el contenido de su pantalla. "5xl" y "7xl" llevan el px-4
   que ya tenían; "feed" existe para Inicio, cuyo contenido usa max-w-[1920px]
   con padding responsivo — con px-4 fijo el título quedaba corrido respecto a
   las tarjetas en pantallas grandes. */
const ANCHOS = {
  "5xl": "max-w-5xl px-4",
  "7xl": "max-w-7xl px-4",
  feed: "max-w-[1920px] px-4 sm:px-6 lg:px-6 xl:px-8",
} as const

export default function SectionHeader({
  titulo,
  subtitulo,
  icono,
  acciones,
  ancho = "5xl",
  onVolver,
}: SectionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur-xl">
      <div className={`mx-auto flex ${ANCHOS[ancho]} items-center gap-3 py-4`}>
        {onVolver && (
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver"
            className="-ml-2 flex-shrink-0 rounded-full p-2 text-ink-2 transition-colors hover:bg-black/5 hover:text-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* El tamaño lo pasa cada pantalla en el svg (className="w-5 h-5"), no
            este contenedor. Se intentó fijarlo acá con [&>svg]:h-5 para que
            ninguna pantalla pudiera olvidarlo, y rompió los íconos que ya se
            veían bien. Si agregas una pantalla, pasa el tamaño en el svg como
            hacen las otras doce. */}
        {icono && <span className="flex-shrink-0 text-blue-600">{icono}</span>}

        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-xl font-bold leading-tight text-ink">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="truncate text-xs text-ink-2">{subtitulo}</p>
          )}
        </div>

        {acciones && <div className="flex flex-shrink-0 items-center gap-2">{acciones}</div>}
      </div>
    </header>
  )
}
