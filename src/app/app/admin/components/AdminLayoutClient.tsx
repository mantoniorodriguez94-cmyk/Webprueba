"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/app/admin",
    label: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    href: "/app/admin/pagos",
    label: "Pagos manuales",
    icon: <PaymentsIcon />,
  },
  {
    href: "/app/admin/negocios",
    label: "Negocios",
    icon: <StoreIcon />,
  },
  {
    href: "/app/admin/destacados",
    label: "Destacados",
    icon: <StarIcon />,
  },
  {
    href: "/app/admin/usuarios",
    label: "Usuarios",
    icon: <UsersIcon />,
  },
  {
    href: "/app/admin/invitaciones",
    label: "Invitaciones",
    icon: <TicketIcon />,
  },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* HEADER SUPERIOR */}
      <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-xl z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Izquierda: botón menú móvil + logo / título */}
          <div className="flex items-center gap-3">
            {/* Botón para abrir sidebar en mobile */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Abrir menú de administración"
            >
              <MenuIcon />
            </button>

            {/* Logo / Marca */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0288D1] to-[#14b8a6] flex items-center justify-center shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M10.5 4a6.5 6.5 0 015.18 10.46l3.43 3.43-1.41 1.41-3.43-3.43A6.5 6.5 0 1110.5 4z" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-gray-200">
                  Encuentra
                </span>
                <span className="text-xs text-blue-400 font-medium tracking-wide">
                  Panel Administrativo
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: botón volver al dashboard usuario + estado admin */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Admin activo
            </span>

            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 gap-4">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:flex flex-col w-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 mt-1 h-[calc(100vh-5rem)] sticky top-20">
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => {
              const isActive =
                item.href === "/app/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                />
              )
            })}
          </nav>

          {/* Footer sidebar */}
          <div className="mt-auto pt-4 text-[10px] text-gray-500 border-t border-white/10">
            © {new Date().getFullYear()} Encuentra  
            <br />
            <span className="text-gray-400">Panel interno de administración</span>
          </div>
        </aside>

        {/* SIDEBAR MÓVIL (DRAWER) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* fondo oscuro */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            {/* panel lateral */}
            <div className="absolute left-0 top-0 h-full w-64 bg-[#020617] border-r border-white/10 shadow-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-100">
                  Menú admin
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10"
                  aria-label="Cerrar menú"
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/app/admin"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive}
                    />
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* CONTENIDO */}
        <main className="flex-1 mt-1">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 min-h-[calc(100vh-7rem)] shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ================================
   COMPONENTE DE LINK DEL SIDEBAR
================================ */
function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
        active
          ? "bg-[#0288D1]/20 border border-[#0288D1]/60 text-white shadow-lg shadow-[#0288D1]/30"
          : "bg-transparent text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
      }`}
    >
      <div className="w-5 h-5 text-current">{icon}</div>
      <span className="truncate">{label}</span>
    </Link>
  )
}

/* ================================
   ICONOS (SVG)
================================ */

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.7">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.7">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.8">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
    </svg>
  )
}

function PaymentsIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7 14h5" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M3 9h18l-2-5H5L3 9Z" />
      <path d="M5 9v11h14V9" />
      <path d="M10 13h4" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="8" r="3.5" />
      <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" />
      <path d="M13 20c0-2.7 1.3-4.6 3.5-5.6" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 100 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 100-4V7a2 2 0 012-2z" />
    </svg>
  )
}

