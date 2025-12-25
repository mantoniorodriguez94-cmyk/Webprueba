"use client"

import { useState, useEffect } from "react"
import NotificationModal from "@/components/ui/NotificationModal"

interface GoldenBorderToggleProps {
  businessId: string
  businessName: string
  isPremium: boolean
  premiumUntil: string | null
}

export default function GoldenBorderToggle({
  businessId,
  businessName,
  isPremium,
  premiumUntil,
}: GoldenBorderToggleProps) {
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [goldenBorderActive, setGoldenBorderActive] = useState(false)
  const [limit, setLimit] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [canActivate, setCanActivate] = useState(false)

  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: "success" | "error" | "warning" | "info"
    title?: string
    message: string
  }>({
    isOpen: false,
    type: "info",
    message: "",
  })

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string
  ) => {
    setNotification({ isOpen: true, type, message, title })
  }

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }

  // Cargar estado inicial
  useEffect(() => {
    fetchStatus()
  }, [businessId])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/businesses/${businessId}/toggle-golden-border`)

      if (!response.ok) {
        throw new Error("Error al cargar el estado")
      }

      const data = await response.json()
      setGoldenBorderActive(data.golden_border_active)
      setLimit(data.limit)
      setActiveCount(data.activeCount)
      setCanActivate(data.canActivate)
    } catch (error) {
      console.error("Error fetching golden border status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    try {
      setToggling(true)

      const response = await fetch(`/api/businesses/${businessId}/toggle-golden-border`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar error con notificación
        if (data.error.includes("límite")) {
          showNotification(
            "warning",
            `Has alcanzado el límite de ${limit} borde${limit > 1 ? 's' : ''} dorado${limit > 1 ? 's' : ''} activo${limit > 1 ? 's' : ''}. Desactiva el borde en otro negocio para activarlo aquí.`,
            "Límite alcanzado"
          )
        } else if (data.error.includes("membresía")) {
          showNotification(
            "info",
            "Necesitas una membresía premium activa para usar el borde dorado.",
            "Membresía requerida"
          )
        } else {
          showNotification("error", data.error, "Error")
        }
        return
      }

      // Actualizar estado
      setGoldenBorderActive(data.golden_border_active)
      setActiveCount(data.activeCount)
      setCanActivate(!data.golden_border_active && data.activeCount < data.limit)

      // Mostrar notificación de éxito
      if (data.golden_border_active) {
        showNotification(
          "success",
          `El borde dorado está ahora activo en ${businessName}`,
          "¡Activado!"
        )
      } else {
        showNotification(
          "success",
          `El borde dorado ha sido desactivado`,
          "Desactivado"
        )
      }
    } catch (error) {
      console.error("Error toggling golden border:", error)
      showNotification("error", "Ocurrió un error al cambiar el estado", "Error")
    } finally {
      setToggling(false)
    }
  }

  // Si no es premium, no mostrar nada
  if (!isPremium || !premiumUntil || new Date(premiumUntil) < new Date()) {
    return null
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-medium text-amber-400">Cargando...</span>
      </div>
    )
  }

  const isDisabled = !goldenBorderActive && !canActivate

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={toggling || isDisabled}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
          goldenBorderActive
            ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:from-amber-500 hover:to-yellow-600 shadow-lg"
            : isDisabled
            ? "bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed"
            : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
        } ${toggling ? "opacity-50 cursor-wait" : ""}`}
        title={
          isDisabled
            ? `Límite alcanzado (${activeCount}/${limit}). Desactiva el borde en otro negocio primero.`
            : goldenBorderActive
            ? "Click para desactivar el borde dorado"
            : "Click para activar el borde dorado"
        }
      >
        {toggling ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span>
              {goldenBorderActive
                ? "Borde Activo"
                : isDisabled
                ? `Límite (${activeCount}/${limit})`
                : "Activar Borde"}
            </span>
          </>
        )}
      </button>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </>
  )
}

