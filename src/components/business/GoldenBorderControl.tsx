"use client"

import { useState, useEffect } from "react"
import NotificationModal from "@/components/ui/NotificationModal"

interface GoldenBorderControlProps {
  businessId: string
  businessName: string
  isPremium: boolean
  premiumUntil: string | null
}

export default function GoldenBorderControl({
  businessId,
  businessName,
  isPremium,
  premiumUntil,
}: GoldenBorderControlProps) {
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [goldenBorderActive, setGoldenBorderActive] = useState(false)
  const [limit, setLimit] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [canActivate, setCanActivate] = useState(false)
  const [membershipType, setMembershipType] = useState<"monthly" | "yearly" | "none">("none")

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
      setMembershipType(data.membershipType)
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
            data.error,
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
          `El borde dorado ha sido activado para ${businessName}`,
          "¡Borde dorado activado!"
        )
      } else {
        showNotification(
          "success",
          `El borde dorado ha sido desactivado para ${businessName}`,
          "Borde dorado desactivado"
        )
      }
    } catch (error) {
      console.error("Error toggling golden border:", error)
      showNotification("error", "Ocurrió un error al cambiar el estado del borde dorado", "Error")
    } finally {
      setToggling(false)
    }
  }

  // Si no es premium, no mostrar el control
  if (!isPremium || !premiumUntil || new Date(premiumUntil) < new Date()) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-amber-500/20 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-amber-500/20 rounded w-full mb-2"></div>
          <div className="h-10 bg-amber-500/20 rounded w-full"></div>
        </div>
      </div>
    )
  }

  const membershipTypeText = membershipType === "monthly" ? "Mensual" : membershipType === "yearly" ? "Anual" : "Ninguna"
  const limitText = limit === 1 ? "1 borde dorado" : `${limit} bordes dorados`

  return (
    <>
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-400">Borde Dorado Premium</h3>
            <p className="text-sm text-amber-300/70">Destaca tu negocio con el borde dorado</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-500/5 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                <strong className="text-amber-400">Membresía {membershipTypeText}:</strong> Tienes un límite de{" "}
                <strong className="text-amber-400">{limitText}</strong> activos simultáneamente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Bordes activos:</span>
            <span className="font-bold text-amber-400">
              {activeCount} / {limit}
            </span>
          </div>
        </div>

        {/* Estado Actual */}
        <div className="flex items-center justify-between mb-4 bg-amber-500/5 rounded-xl p-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Estado actual</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  goldenBorderActive ? "bg-amber-400" : "bg-gray-500"
                }`}
              ></div>
              <span className={`font-semibold ${goldenBorderActive ? "text-amber-400" : "text-gray-400"}`}>
                {goldenBorderActive ? "Activo" : "Desactivado"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling || (!goldenBorderActive && !canActivate)}
          className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
            goldenBorderActive
              ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
              : canActivate
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-900"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          } ${toggling ? "opacity-50 cursor-wait" : ""}`}
        >
          {toggling ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
              Procesando...
            </span>
          ) : goldenBorderActive ? (
            "Desactivar Borde Dorado"
          ) : canActivate ? (
            "Activar Borde Dorado"
          ) : (
            `Límite alcanzado (${activeCount}/${limit})`
          )}
        </button>

        {/* Mensaje de ayuda */}
        {!goldenBorderActive && !canActivate && (
          <p className="text-xs text-amber-300/60 mt-3 text-center">
            Desactiva el borde dorado en otro negocio para activarlo aquí
          </p>
        )}
      </div>

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

