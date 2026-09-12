"use client"

/**
 * Barra inferior de navegación (solo móvil).
 *
 * Antes tenía tres destinos —Inicio, Mensajes, Perfil— idénticos para negocios
 * y para personas: el componente ya distinguía los dos casos, pero las dos
 * ramas devolvían exactamente la misma lista. Eso dejaba fuera destinos de uso
 * diario (Mis Negocios, Guardados, Buscar), enterrados en menús.
 *
 * Ahora cada público ve lo suyo. Cinco es el tope deliberado: con seis, las
 * etiquetas se cortan en pantallas de 360 px.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { destinosPrincipales } from "@/lib/navegacion"

interface BottomNavProps {
  isCompany?: boolean
  unreadCount?: number
  messagesHref?: string
  /**
   * Enlace directo a la gestión del negocio del dueño. Sin esto el botón
   * apunta a la lista, que al cargar redirige a la gestión — funciona, pero
   * se ve el salto de una pantalla a otra.
   */
  miNegocioHref?: string
}

export default function BottomNav({
  isCompany = false,
  unreadCount = 0,
  messagesHref,
  miNegocioHref,
}: BottomNavProps) {
  const pathname = usePathname()

  // La lista vive en src/lib/navegacion.ts, compartida con el menú del avatar
  // en escritorio: los dos tienen que ofrecer exactamente los mismos destinos.
  const destinos = destinosPrincipales({
    isCompany,
    pathname,
    unreadCount,
    messagesHref,
    miNegocioHref,
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transform-gpu bg-white/90 backdrop-blur-md border-t border-black/10 safe-bottom">
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {destinos.map(({ href, label, Icono, activo, badge }) => (
          <Link
            key={label}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors ${
              activo ? "bg-blue-50" : "hover:bg-black/5"
            }`}
          >
            {activo && (
              <span className="absolute -top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-blue-500" />
            )}

            {Boolean(badge && badge > 0) && (
              <span className="absolute top-0.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {badge! > 9 ? "9+" : badge}
              </span>
            )}

            <Icono
              className={`w-[22px] h-[22px] transition-colors ${
                activo ? "text-blue-600" : "text-ink-2"
              }`}
              strokeWidth={activo ? 2.2 : 1.8}
            />
            <span
              className={`text-[10px] font-semibold leading-none text-center ${
                activo ? "text-blue-600" : "text-ink-2"
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
