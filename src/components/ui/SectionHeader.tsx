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
  ancho?: "5xl" | "7xl"
  /**
   * "barra"   — barra fija con vidrio y línea divisoria.
   * "portada" — el tratamiento de Inicio: título grande y centrado sobre la
   *             malla, sin barra ni división. Se va con el desplazamiento,
   *             así que conviene donde el encabezado no necesita estar
   *             siempre a mano.
   */
  variante?: "barra" | "portada"
}

const ANCHOS = {
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
} as const

export default function SectionHeader({
  titulo,
  subtitulo,
  icono,
  acciones,
  ancho = "5xl",
  variante = "barra",
}: SectionHeaderProps) {
  if (variante === "portada") {
    return (
      <div className={`mx-auto ${ANCHOS[ancho]} px-4 pt-8 lg:px-6`}>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3">
            {icono && (
              // El ícono se agranda desde acá para que las pantallas puedan
              // seguir pasándolo con su tamaño de barra sin duplicar código.
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-16 sm:w-16 [&>svg]:h-7 [&>svg]:w-7">
                {icono}
              </span>
            )}
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">{titulo}</h1>
          </div>

          {subtitulo && (
            <p className="mx-auto mt-3 max-w-sm text-sm text-ink-2">{subtitulo}</p>
          )}

          {acciones && (
            <div className="mt-4 flex items-center justify-center gap-2">{acciones}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur-xl">
      <div className={`mx-auto flex ${ANCHOS[ancho]} items-center gap-3 px-4 py-4`}>
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
