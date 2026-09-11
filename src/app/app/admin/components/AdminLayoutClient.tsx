"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Drawer } from "@/components/ui/Overlay"

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

type NavGroup = {
  /** Sin título = grupo "suelto" (Dashboard solo, arriba del todo). */
  title?: string
  items: NavItem[]
}

// Antes una lista plana de 7 ítems sin jerarquía. Se agrupan por dominio
// para que el sidebar se lea como una estructura, no una lista arbitraria.
const navGroups: NavGroup[] = [
  {
    items: [{ href: "/app/admin", label: "Dashboard", icon: <DashboardIcon /> }],
  },
  {
    title: "Negocios",
    items: [
      { href: "/app/admin/negocios", label: "Negocios", icon: <StoreIcon /> },
      { href: "/app/admin/destacados", label: "Destacados", icon: <StarIcon /> },
    ],
  },
  {
    title: "Personas",
    items: [
      { href: "/app/admin/usuarios", label: "Usuarios", icon: <UsersIcon /> },
      { href: "/app/admin/referrales", label: "Referidos", icon: <GiftIcon /> },
      { href: "/app/admin/invitaciones", label: "Invitaciones", icon: <TicketIcon /> },
    ],
  },
  {
    title: "Pagos",
    items: [{ href: "/app/admin/pagos", label: "Pagos manuales", icon: <PaymentsIcon /> }],
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
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* HEADER SUPERIOR */}
      <header className="w-full border-b border-black/8 bg-white/80 backdrop-blur-xl z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Izquierda: botón menú móvil + logo / título */}
          <div className="flex items-center gap-3">
            {/* Botón para abrir sidebar en mobile */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-black/8 bg-black/5 hover:bg-black/10 transition"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Abrir menú de administración"
            >
              <MenuIcon />
            </button>

            {/* Logo / Marca */}
            <div className="flex items-center gap-2">
              <Image
                src="/brand/encuentra-mark.svg"
                alt="App Encuentra"
                width={36}
                height={36}
                className="w-9 h-9"
                unoptimized
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-ink">
                  App Encuentra
                </span>
                <span className="text-xs text-blue-600 font-medium tracking-wide">
                  Panel Administrativo
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: estado admin + acciones rápidas */}
          <div className="flex items-center gap-3">
            <span className="group hidden sm:inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse group-hover:animate-radar-pulse" />
              Admin activo
            </span>

            {/* Botón para bloquear manualmente el panel (cierra sesión de Gatekeeper + PIN maestro) */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/admin/security/logout", { method: "POST" })
                } catch {
                  // Si falla el logout, igualmente forzamos recarga: el Gatekeeper reforzará acceso
                } finally {
                  if (typeof window !== "undefined") {
                    window.location.reload()
                  }
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition"
            >
              <span className="text-sm leading-none">🔒</span>
              <span className="hidden sm:inline">Bloquear Panel</span>
              <span className="sm:hidden">Lock</span>
            </button>

            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full bg-black/5 border border-black/8 hover:bg-black/10 text-ink-2 hover:text-ink transition"
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
        <aside className="hidden md:flex flex-col w-64 surface rounded-3xl p-4 mt-1 h-[calc(100vh-5rem)] sticky top-20 shadow-sm">
          <NavGroupsList groups={navGroups} pathname={pathname} />

          {/* Footer sidebar */}
          <div className="mt-auto pt-4 text-[10px] text-ink-2/70 border-t border-black/8">
            © {new Date().getFullYear()} App Encuentra
            <br />
            <span className="text-ink-2/70">Panel interno de administración</span>
          </div>
        </aside>

        {/* SIDEBAR MÓVIL — Drawer compartido (antes {sidebarOpen && (...)} sin animación) */}
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className="md:hidden"
          aria-label="Menú de administración"
          panelClassName="h-full w-64 bg-white border-r border-black/8 shadow-2xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-ink">
              Menú admin
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 border border-black/8"
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </button>
          </div>

          <NavGroupsList groups={navGroups} pathname={pathname} />

          {/* Acción de bloqueo rápido también disponible en móvil */}
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/admin/security/logout", { method: "POST" })
              } catch {
              } finally {
                if (typeof window !== "undefined") {
                  window.location.reload()
                }
              }
            }}
            className="mt-4 inline-flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
          >
            <span className="text-sm leading-none">🔒</span>
            <span>Bloquear Panel</span>
          </button>
        </Drawer>

        {/* CONTENIDO */}
        <main className="flex-1 mt-1">
          <div className="surface rounded-3xl p-4 sm:p-6 md:p-8 min-h-[calc(100vh-7rem)] shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ================================
   GRUPOS DE NAVEGACIÓN DEL SIDEBAR (compartido entre desktop y Drawer móvil)
================================ */
function NavGroupsList({ groups, pathname }: { groups: NavGroup[]; pathname: string }) {
  return (
    <nav className="flex flex-col gap-4 text-sm">
      {groups.map((group, i) => (
        <div key={group.title ?? `group-${i}`} className="flex flex-col gap-1">
          {group.title && (
            <span className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-2/70">
              {group.title}
            </span>
          )}
          {group.items.map((item) => {
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
        </div>
      ))}
    </nav>
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
          ? "bg-blue-50 border border-blue-200 text-blue-700"
          : "bg-transparent text-ink-2 hover:bg-black/5 hover:text-ink border border-transparent"
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

function GiftIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7M5 12h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12a2 2 0 012-2h10a2 2 0 012 2" />
    </svg>
  )
}

