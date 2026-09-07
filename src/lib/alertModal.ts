// src/lib/alertModal.ts
// ---------------------------------------------
// Reemplazo global para window.alert() con el mismo look & feel que
// ConfirmationModal (modal centrado, flotante, con blur de fondo).
//
// Uso: alertModal.success("Título", "Descripción opcional")
//      alertModal.error("Título", "Descripción opcional")
//
// <AlertModalHost /> está montado una sola vez en el layout raíz — igual
// que <Toaster /> — y renderiza lo que se le pida desde cualquier componente.

import type { AlertModalType } from "@/components/ui/AlertModal"

export interface AlertModalOptions {
  description?: string
  confirmLabel?: string
  /** Se ejecuta cuando el usuario cierra el modal (equivalente al "OK" de alert()). */
  onClose?: () => void
}

export interface AlertModalState extends AlertModalOptions {
  open: boolean
  type: AlertModalType
  title: string
}

type Listener = (state: AlertModalState) => void

let listener: Listener | null = null

function show(type: AlertModalType, title: string, options?: AlertModalOptions) {
  listener?.({ open: true, type, title, ...options })
}

export const alertModal = {
  success: (title: string, options?: AlertModalOptions) => show("success", title, options),
  error: (title: string, options?: AlertModalOptions) => show("error", title, options),
  warning: (title: string, options?: AlertModalOptions) => show("warning", title, options),
  info: (title: string, options?: AlertModalOptions) => show("info", title, options),
}

export function _subscribeAlertModal(cb: Listener) {
  listener = cb
  return () => {
    if (listener === cb) listener = null
  }
}
