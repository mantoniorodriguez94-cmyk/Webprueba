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
import { useEffect, useState } from "react"
import { Home, MessageCircle, User, Store, Crown, Search, Bookmark } from "lucide-react"

interface BottomNavProps {
  isCompany?: boolean
  unreadCount?: number
  messagesHref?: string
}

type Destino = {
  href: string
  label: string
  Icono: React.ElementType
  activo: boolean
  badge?: number
}

export default function BottomNav({
  isCompany = false,
  unreadCount = 0,
  messagesHref,
}: BottomNavProps) {
  const pathname = usePathname()
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) return null

  const hrefMensajes = messagesHref || "/app/dashboard/chat"

  const inicio: Destino = {
    href: "/app/dashboard",
    label: "Inicio",
    Icono: Home,
    activo: pathname === "/app/dashboard",
  }

  const mensajes: Destino = {
    href: hrefMensajes,
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

  const destinos: Destino[] = isCompany
    ? [
        // Un dueño entra a gestionar lo suyo y a revisar su plan: antes ambas
        // cosas estaban a dos o tres toques de distancia.
        inicio,
        {
          href: "/app/dashboard/mis-negocios",
          label: "Mi negocio",
          Icono: Store,
          activo: Boolean(pathname?.startsWith("/app/dashboard/mis-negocios")),
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
    : [
        inicio,
        {
          // Abre el buscador del directorio, que vivía escondido en un botón
          // del encabezado.
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-md border-t border-black/10 safe-bottom">
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
