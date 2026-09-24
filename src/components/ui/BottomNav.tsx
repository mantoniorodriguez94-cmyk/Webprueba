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

  /* Barra flotante, no pegada al filo.
     Iba `bottom-0 left-0 right-0` con `border-t`: de lado a lado y contra el
     borde de la pantalla. Ahora se separa unos milímetros de los tres lados,
     se redondea y se levanta con una sombra, así se lee como algo que va POR
     ENCIMA del contenido y no como el final de la página.

     El hueco de abajo suma env(safe-area-inset-bottom), igual que hace
     Overlay.tsx. Hoy ese valor es 0 porque el viewport no declara
     viewport-fit: cover, pero si algún día se declara, la barra sube sola por
     encima del indicador de inicio en vez de quedar debajo.

     Se va también `safe-bottom`, que estaba en la lista de clases desde
     siempre y no existe: no está definida ni en globals.css ni en la
     configuración de Tailwind, así que no hacía absolutamente nada.

     max-w-lg con mx-auto porque `lg:hidden` llega hasta 1023 px: sin tope, en
     una tablet los cinco destinos quedaban desparramados a lo ancho de toda
     la pantalla. */
  return (
    <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 mx-auto max-w-lg z-50 lg:hidden transform-gpu rounded-[1.75rem] bg-white/90 dark:bg-paper-2/95 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg shadow-black/10 dark:shadow-black/50">
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {destinos.map(({ href, label, Icono, activo, badge }) => (
          <Link
            key={label}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors ${
              activo ? "bg-blue-50 dark:bg-blue-500/15" : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {/* Acá había una pestañita azul en `-top-1.5`, o sea fuera de la
                barra. Contra un borde recto y a ras del suelo se leía como el
                indicador de pestaña activa; asomando por encima de una barra
                redondeada y flotante queda como un trozo suelto. El destino
                activo ya se distingue por el fondo teñido, el ícono y la
                etiqueta en azul, que es señal de sobra. */}

            {Boolean(badge && badge > 0) && (
              <span className="absolute top-0.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {badge! > 9 ? "9+" : badge}
              </span>
            )}

            <Icono
              className={`w-[22px] h-[22px] transition-colors ${
                activo ? "text-blue-600 dark:text-blue-400" : "text-ink-2"
              }`}
              strokeWidth={activo ? 2.2 : 1.8}
            />
            <span
              className={`text-[10px] font-semibold leading-none text-center ${
                activo ? "text-blue-600 dark:text-blue-400" : "text-ink-2"
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
