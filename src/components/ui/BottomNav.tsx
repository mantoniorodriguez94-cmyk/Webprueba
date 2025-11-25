"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface BottomNavProps {
  isCompany?: boolean
  unreadCount?: number
  messagesHref?: string // URL dinámica para mensajes
}

export default function BottomNav({ isCompany = false, unreadCount = 0, messagesHref }: BottomNavProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Usar messagesHref si se proporciona, sino usar la ruta por defecto
  const defaultMessagesHref = isCompany ? "/app/dashboard/mis-negocios" : "/app/dashboard/mis-mensajes"
  const finalMessagesHref = messagesHref || defaultMessagesHref

  const navItems = isCompany
    ? [
        {
          href: "/app/dashboard",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          label: "Inicio",
          active: pathname === "/app/dashboard",
        },
        {
          href: "/app/dashboard/mis-negocios",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          label: "Negocios",
          active: pathname?.startsWith("/app/dashboard/mis-negocios") || pathname?.includes("/negocios/"),
        },
        {
          href: finalMessagesHref,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
          label: "Mensajes",
          active: pathname?.includes("/mensajes"),
          badge: unreadCount,
        },
        {
          href: "/app/dashboard/perfil",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: "Perfil",
          active: pathname === "/app/dashboard/perfil",
        },
      ]
    : [
        {
          href: "/app/dashboard",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          label: "Inicio",
          active: pathname === "/app/dashboard",
        },
        {
          href: "/app/dashboard",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
          label: "Explorar",
          active: false,
        },
        {
          href: finalMessagesHref,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
          label: "Mensajes",
          active: pathname?.includes("/mensajes"),
          badge: unreadCount,
        },
        {
          href: "/app/dashboard/perfil",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: "Perfil",
          active: pathname === "/app/dashboard/perfil",
        },
      ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-2xl transition-all duration-300 ${
              item.active
                ? "bg-blue-500/20"
                : "hover:bg-gray-800/50"
            }`}
          >
            {/* Badge de notificaciones */}
            {item.badge && item.badge > 0 && (
              <div className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                {item.badge > 9 ? "9+" : item.badge}
              </div>
            )}

            {/* Icono */}
            <div
              className={`transition-all duration-300 ${
                item.active ? "text-blue-400 scale-110" : "text-gray-400"
              }`}
            >
              {item.icon}
            </div>

            {/* Label */}
            <span
              className={`text-xs font-semibold mt-1 transition-colors ${
                item.active ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {item.label}
            </span>

            {/* Indicador activo */}
            {item.active && (
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}

