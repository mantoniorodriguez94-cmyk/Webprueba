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
    iconWrap: "bg-emerald-500/20 border-emerald-500/50",
    iconColor: "text-emerald-400",
    ring: "border-emerald-500/30 shadow-emerald-500/25",
    button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40",
  },
  error: {
    icon: XCircle,
    iconWrap: "bg-red-500/20 border-red-500/50",
    iconColor: "text-red-400",
    ring: "border-red-500/30 shadow-red-500/25",
    button: "bg-red-600 hover:bg-red-500 shadow-red-600/40",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-yellow-500/20 border-yellow-500/50",
    iconColor: "text-yellow-400",
    ring: "border-yellow-500/30 shadow-yellow-500/25",
    button: "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/40",
  },
  info: {
    icon: Info,
    iconWrap: "bg-blue-500/20 border-blue-500/50",
    iconColor: "text-blue-400",
    ring: "border-blue-500/30 shadow-blue-500/25",
    button: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/40",
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
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
            className={`max-w-md w-full bg-gray-950/90 border rounded-3xl shadow-2xl p-6 sm:p-7 ${style.ring}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-10 h-10 flex-shrink-0 rounded-2xl border flex items-center justify-center ${style.iconWrap}`}>
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto inline-flex items-center justify-center rounded-2xl text-white px-5 py-2.5 text-sm font-semibold shadow-lg transition-colors ${style.button}`}
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
