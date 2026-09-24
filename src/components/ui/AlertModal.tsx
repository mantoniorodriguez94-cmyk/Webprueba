"use client"

import { AnimatePresence, motion } from "framer-motion"
import React from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

export type AlertModalType = "success" | "error" | "warning" | "info"

interface AlertModalProps {
  open: boolean
  type: AlertModalType
  title: string
  description?: string
  confirmLabel?: string
  onClose: () => void
}

const STYLES: Record<
  AlertModalType,
  { icon: React.ElementType; iconWrap: string; iconColor: string; ring: string; button: string }
> = {
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    ring: "border-green-200",
    button: "bg-green-600 hover:bg-green-700",
  },
  error: {
    icon: XCircle,
    iconWrap: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
    ring: "border-red-200",
    button: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    ring: "border-amber-200",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    icon: Info,
    iconWrap: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    ring: "border-blue-200",
    button: "bg-blue-500 hover:bg-blue-600",
  },
}

export default function AlertModal({
  open,
  type,
  title,
  description,
  confirmLabel = "Entendido",
  onClose,
}: AlertModalProps) {
  const style = STYLES[type]
  const Icon = style.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`max-w-md w-full bg-white dark:bg-paper-2 border rounded-3xl shadow-2xl p-6 sm:p-7 ${style.ring}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-10 h-10 flex-shrink-0 rounded-2xl border flex items-center justify-center ${style.iconWrap}`}>
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-ink mb-1">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto inline-flex items-center justify-center rounded-2xl text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-colors ${style.button}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
