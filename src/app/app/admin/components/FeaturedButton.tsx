"use client"

import { useState } from "react"
import FeaturedDaysModal from "./FeaturedDaysModal"

/**
 * El botón de Destacar de la ficha de negocio: abre el modal que pide los días.
 *
 * Antes era AdminActionButton, un botón genérico con un prop `type` que servía
 * a tres acciones. Las otras dos se fueron porque no hacían lo que decían:
 *
 *   - "Suspender Premium" llamaba a /api/admin/business/suspender, una ruta
 *     borrada al limpiar las acciones rápidas. Devolvía 404.
 *   - "Activar Premium" escribía is_premium, la bandera del sistema anterior a
 *     los niveles. Tener dos formas de decir "este negocio pagó" es la
 *     divergencia de siempre; "Cambiar Tier", en la lista de negocios, es la
 *     única que debe existir.
 *
 * Con una sola acción, el prop `type` sobraba: un botón genérico con un único
 * valor legal es un nombre que promete más de lo que hay.
 */
interface FeaturedButtonProps {
  businessId: string
  businessName: string
  /** "Destacar" o "Quitar Destacado", según el estado actual. */
  label: string
}

export default function FeaturedButton({
  businessId,
  businessName,
  label,
}: FeaturedButtonProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-black/5 text-ink hover:bg-black/10"
      >
        {label}
      </button>

      <FeaturedDaysModal
        businessId={businessId}
        businessName={businessName}
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        onSuccess={() => {
          setAbierto(false)
          window.location.reload()
        }}
      />
    </>
  )
}
