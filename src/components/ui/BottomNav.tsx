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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-transparent backdrop-blur-sm border-t border-white/20 safe-bottom">
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

