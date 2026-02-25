"use client"

import { AnimatePresence, motion } from "framer-motion"
import React from "react"

interface ConfirmationModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Eliminar definitivamente",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
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
            className="max-w-md w-full bg-gray-950/90 border border-red-500/30 rounded-3xl shadow-2xl shadow-red-500/25 p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v4m0 4h.01M5.455 19h13.09c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.723 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {title}
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-gray-600 bg-gray-800/60 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-gray-700/80 hover:border-gray-500 transition-colors disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-red-600/40 transition-colors disabled:opacity-60"
              >
                {loading ? "Eliminando..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

