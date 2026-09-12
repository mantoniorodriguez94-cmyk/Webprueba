/**
 * Los destinos principales de la app, en un solo lugar.
 *
 * Se usan en dos sitios que tienen que decir exactamente lo mismo:
 *
 *   - La barra inferior, en móvil.
 *   - El menú del avatar, en escritorio — donde la barra está oculta
 *     (`lg:hidden`) y por lo tanto ese menú ES la navegación.
 *
 * Viven acá y no duplicados en cada componente por el motivo de siempre: una
 * lista escrita dos veces se desincroniza a la primera que alguien agregue un
 * destino en uno y se olvide del otro.
 *
 * Los destinos dependen del público. Un dueño de negocio entra a gestionar lo
 * suyo y a revisar su plan; una persona entra a buscar y a ver lo que guardó.
 * Cinco es el tope deliberado: con seis, las etiquetas se cortan en la barra
 * en pantallas de 360 px.
 */

import { Home, MessageCircle, User, Store, Crown, Search, Bookmark } from "lucide-react"

export type Destino = {
  href: string
  label: string
  Icono: React.ElementType
  activo: boolean
  badge?: number
}

interface Opciones {
  isCompany: boolean
  /** Ruta actual, para marcar el destino activo. */
  pathname: string | null
  unreadCount?: number
  /** Bandeja del negocio para dueños, bandeja propia para el resto. */
  messagesHref?: string
  /**
   * Enlace directo a la gestión del negocio del dueño. Sin esto el botón
   * apunta a la lista, que al cargar redirige a la gestión — funciona, pero
   * se ve el salto de una pantalla a otra.
   */
  miNegocioHref?: string
}

export function destinosPrincipales({
  isCompany,
  pathname,
  unreadCount = 0,
  messagesHref,
  miNegocioHref,
}: Opciones): Destino[] {
  const inicio: Destino = {
    href: "/app/dashboard",
    label: "Inicio",
    Icono: Home,
    activo: pathname === "/app/dashboard",
  }

  const mensajes: Destino = {
    href: messagesHref || "/app/dashboard/chat",
    label: "Mensajes",
    Icono: MessageCircle,
    activo: Boolean(pathname?.includes("/chat") || pathname?.includes("/mensajes")),
    badge: unreadCount,
  }

  const perfil: Destino = {
    href: "/app/dashboard/perfil",
    label: "Perfil",
    Icono: User,
    activo: pathname === "/app/dashboard/perfil",
  }

  if (isCompany) {
    return [
      inicio,
      {
        href: miNegocioHref ?? "/app/dashboard/mis-negocios",
        label: "Mi negocio",
        Icono: Store,
        // Activo en las dos rutas: la lista y la gestión del negocio, porque
        // ambas son "mi negocio" desde el punto de vista de quien navega.
        activo: Boolean(
          pathname?.startsWith("/app/dashboard/mis-negocios") ||
            pathname?.startsWith("/app/dashboard/negocios/")
        ),
      },
      mensajes,
      {
        href: "/app/dashboard/membresia",
        label: "Plan",
        Icono: Crown,
        activo: Boolean(pathname?.startsWith("/app/dashboard/membresia")),
      },
      perfil,
    ]
  }

  return [
    inicio,
    {
      // Abre el buscador del directorio, que vivía escondido en un botón del
      // encabezado.
      href: "/app/dashboard?buscar=1",
      label: "Buscar",
      Icono: Search,
      activo: false,
    },
    {
      href: "/app/dashboard/guardados",
      label: "Guardados",
      Icono: Bookmark,
      activo: Boolean(pathname?.startsWith("/app/dashboard/guardados")),
    },
    mensajes,
    perfil,
  ]
}
