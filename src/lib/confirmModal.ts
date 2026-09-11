/**
 * Confirmaciones con el modal de la app, en vez del `confirm()` del navegador.
 *
 * Uso:
 *   if (await confirmModal("¿Eliminar esta promoción?", {
 *         description: "Esta acción no se puede deshacer.",
 *         confirmLabel: "Eliminar",
 *         danger: true,
 *       })) { ... }
 *
 * Devuelve una promesa que se resuelve en true/false, así que reemplaza al
 * `confirm()` nativo sin reescribir la lógica alrededor: solo se agrega await.
 *
 * Mismo patrón que [alertModal]: un único host montado en el layout raíz se
 * suscribe acá y renderiza. Así cualquier componente puede pedir una
 * confirmación sin manejar estado propio ni montar su propio modal.
 *
 * Motivo del cambio: el `confirm()` del navegador se ve distinto en cada
 * sistema operativo, ignora por completo la identidad visual de la app, y
 * convivía con el ConfirmationModal propio — que ya se usaba para borrar un
 * negocio. Dos estilos para la misma pregunta.
 */

export interface ConfirmModalOptions {
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Tiñe de rojo la acción principal, para operaciones destructivas. */
  danger?: boolean
}

export interface ConfirmModalState extends ConfirmModalOptions {
  open: boolean
  title: string
  resolve: (valor: boolean) => void
}

type Listener = (state: ConfirmModalState) => void

let listener: Listener | null = null

export function confirmModal(title: string, options?: ConfirmModalOptions): Promise<boolean> {
  // Sin host montado no hay forma de preguntar. Se niega por defecto: es la
  // opción segura, porque estas confirmaciones protegen acciones destructivas.
  if (!listener) return Promise.resolve(false)

  return new Promise<boolean>((resolve) => {
    listener?.({ open: true, title, ...options, resolve })
  })
}

export function _subscribeConfirmModal(cb: Listener) {
  listener = cb
  return () => {
    if (listener === cb) listener = null
  }
}
