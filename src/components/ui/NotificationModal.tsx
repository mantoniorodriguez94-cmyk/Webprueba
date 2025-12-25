"use client"

import { useEffect } from "react"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error" | "warning" | "info"
  title?: string
  message: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = false,
  autoCloseDelay = 3000,
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case "error":
        return (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case "warning":
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case "info":
        return (
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gray-900 border-green-500/30",
          title: "text-green-400",
          message: "text-gray-300",
          button: "bg-green-600 hover:bg-green-700",
        }
      case "error":
        return {
          bg: "bg-gray-900 border-red-500/30",
          title: "text-red-400",
          message: "text-gray-300",
          button: "bg-red-600 hover:bg-red-700",
        }
      case "warning":
        return {
          bg: "bg-gray-900 border-yellow-500/30",
          title: "text-yellow-400",
          message: "text-gray-300",
          button: "bg-yellow-600 hover:bg-yellow-700",
        }
      case "info":
        return {
          bg: "bg-gray-900 border-blue-500/30",
          title: "text-blue-400",
          message: "text-gray-300",
          button: "bg-blue-600 hover:bg-blue-700",
        }
    }
  }

  const colors = getColors()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`${colors.bg} border-2 rounded-3xl p-6 max-w-md w-full pointer-events-auto animate-scale-in shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>

          {/* Title */}
          {title && (
            <h3 className={`text-xl font-bold ${colors.title} text-center mb-3`}>
              {title}
            </h3>
          )}

          {/* Message */}
          <p className={`${colors.message} text-center mb-6 whitespace-pre-line leading-relaxed`}>
            {message}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className={`w-full ${colors.button} text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            Entendido
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

