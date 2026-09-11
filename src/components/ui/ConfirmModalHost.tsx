"use client"

import { useEffect, useState } from "react"
import ConfirmationModal from "./ConfirmationModal"
import { _subscribeConfirmModal, type ConfirmModalState } from "@/lib/confirmModal"

const ESTADO_INICIAL: ConfirmModalState = {
  open: false,
  title: "",
  resolve: () => {},
}

/** Montar una sola vez en el layout raíz, junto a <AlertModalHost />. */
export default function ConfirmModalHost() {
  const [estado, setEstado] = useState<ConfirmModalState>(ESTADO_INICIAL)

  useEffect(() => {
    return _subscribeConfirmModal(setEstado)
  }, [])

  // Toda salida del modal resuelve la promesa: si se cerrara sin resolver,
  // quien hizo `await confirmModal(...)` quedaría esperando para siempre.
  const cerrar = (valor: boolean) => {
    setEstado((prev) => {
      prev.resolve(valor)
      return { ...prev, open: false }
    })
  }

  return (
    <ConfirmationModal
      open={estado.open}
      title={estado.title}
      description={estado.description ?? ""}
      confirmLabel={estado.confirmLabel}
      cancelLabel={estado.cancelLabel}
      onConfirm={() => cerrar(true)}
      onClose={() => cerrar(false)}
    />
  )
}
