"use client"

/**
 * Overlay.tsx — primitivos de apertura/cierre compartidos por toda la app.
 *
 * Generaliza el patrón que ya usaban AlertModal y ConfirmationModal
 * (AnimatePresence + backdrop fade + panel scale/opacity/y, duration 0.2,
 * ease "easeOut") en cuatro formas reutilizables:
 *
 *   - Dialog   → modal centrado (confirmaciones, formularios cortos).
 *   - Sheet    → hoja inferior móvil (filtros, búsqueda, acciones).
 *   - Drawer   → panel lateral (menús de navegación, izquierdo).
 *   - Popover  → dropdown anclado a un trigger (menú de usuario, etc.).
 *
 * Los cuatro usan AnimatePresence para que la animación de SALIDA también
 * se reproduzca (el bug que tenían casi todos los overlays de la app:
 * `{open && (...)}` desmonta en seco, sin transición de cierre).
 */

import { AnimatePresence, motion } from "framer-motion"
import React, { useEffect } from "react"

const EASE = "easeOut" as const
const DURATION = 0.2

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

function useEscapeKey(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active || !onEscape) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [active, onEscape])
}

interface BaseOverlayProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Clases del panel (fondo, borde, radio, sombra, padding). */
  panelClassName?: string
  /** Clases extra en el contenedor del backdrop (para z-index custom, etc). */
  className?: string
  closeOnBackdropClick?: boolean
  lockScroll?: boolean
  "aria-label"?: string
}

const DEFAULT_PANEL =
  "bg-white border border-black/10 shadow-2xl text-ink"

/* ────────────────────────── Dialog ────────────────────────── */

export function Dialog({
  open,
  onClose,
  children,
  panelClassName = `max-w-md w-full ${DEFAULT_PANEL} rounded-3xl p-6 sm:p-7`,
  className = "",
  closeOnBackdropClick = true,
  lockScroll = true,
  ...rest
}: BaseOverlayProps) {
  useLockBodyScroll(open && lockScroll)
  useEscapeKey(open, onClose)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 backdrop-blur-md px-4 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdropClick ? onClose : undefined}
          role="dialog"
          aria-modal="true"
          aria-label={rest["aria-label"]}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ duration: DURATION, ease: EASE }}
            className={panelClassName}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────── Sheet ────────────────────────── */
/* Hoja inferior móvil: entra desde el borde inferior de la pantalla. */

export function Sheet({
  open,
  onClose,
  children,
  panelClassName = `w-full max-h-[85vh] overflow-y-auto ${DEFAULT_PANEL} rounded-t-3xl px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]`,
  className = "",
  closeOnBackdropClick = true,
  lockScroll = true,
  ...rest
}: BaseOverlayProps) {
  useLockBodyScroll(open && lockScroll)
  useEscapeKey(open, onClose)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[9999] flex items-end justify-center bg-ink/35 backdrop-blur-sm ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdropClick ? onClose : undefined}
          role="dialog"
          aria-modal="true"
          aria-label={rest["aria-label"]}
        >
          {/* Asa visual — comunica "arrastrable" incluso sin gesto real */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: DURATION + 0.08, ease: EASE }}
            className={panelClassName}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────── Drawer ────────────────────────── */
/* Panel lateral (izquierdo): para menús de navegación. */

export function Drawer({
  open,
  onClose,
  children,
  panelClassName = `h-full w-[85vw] max-w-sm overflow-y-auto ${DEFAULT_PANEL} p-5`,
  className = "",
  closeOnBackdropClick = true,
  lockScroll = true,
  side = "left",
  ...rest
}: BaseOverlayProps & { side?: "left" | "right" }) {
  useLockBodyScroll(open && lockScroll)
  useEscapeKey(open, onClose)

  const isLeft = side === "left"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[9999] flex ${isLeft ? "justify-start" : "justify-end"} bg-ink/35 backdrop-blur-sm ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdropClick ? onClose : undefined}
          role="dialog"
          aria-modal="true"
          aria-label={rest["aria-label"]}
        >
          <motion.div
            initial={{ x: isLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isLeft ? "-100%" : "100%" }}
            transition={{ duration: DURATION + 0.08, ease: EASE }}
            className={panelClassName}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────── Popover ────────────────────────── */
/* Dropdown pequeño anclado a un trigger (menú de usuario, etc). El padre
   debe tener `className="relative"` — el Popover se posiciona absolute
   respecto a él, sin backdrop oscuro de pantalla completa (solo una capa
   transparente para detectar el click-afuera). */

interface PopoverProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Posición respecto al trigger padre. */
  align?: "left" | "right"
  panelClassName?: string
  className?: string
}

export function Popover({
  open,
  onClose,
  children,
  align = "right",
  panelClassName = `${DEFAULT_PANEL} rounded-2xl p-2 min-w-[12rem]`,
  className = "",
}: PopoverProps) {
  useEscapeKey(open, onClose)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Capa transparente para cerrar al hacer click afuera, sin oscurecer la pantalla */}
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: DURATION, ease: EASE }}
            style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
            className={`absolute z-[9999] top-full mt-2 ${align === "right" ? "right-0" : "left-0"} ${panelClassName} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
