"use client"

import { useEffect, useState } from "react"
import AlertModal from "./AlertModal"
import { _subscribeAlertModal, type AlertModalState } from "@/lib/alertModal"

const INITIAL_STATE: AlertModalState = {
  open: false,
  type: "info",
  title: "",
}

/** Montar una sola vez en el layout raíz, junto a <Toaster />. */
export default function AlertModalHost() {
  const [state, setState] = useState<AlertModalState>(INITIAL_STATE)

  useEffect(() => {
    return _subscribeAlertModal(setState)
  }, [])

  const handleClose = () => {
    setState((prev) => ({ ...prev, open: false }))
    state.onClose?.()
  }

  return (
    <AlertModal
      open={state.open}
      type={state.type}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      onClose={handleClose}
    />
  )
}
