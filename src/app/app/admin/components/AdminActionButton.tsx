"use client"

import { useState } from "react"
import VerifyPremiumModal from "./VerifyPremiumModal"
import UpdatePhotosLimitModal from "./UpdatePhotosLimitModal"
import FeaturedDaysModal from "./FeaturedDaysModal"

interface AdminActionButtonProps {
  id: string
  type: "verificar" | "suspender" | "destacar" | "foto_limite"
  label: string
  disabled?: boolean
  businessName?: string
  currentMaxPhotos?: number
}

export default function AdminActionButton({ 
  id, 
  type, 
  label, 
  disabled = false,
  businessName = "Negocio",
  currentMaxPhotos = 5
}: AdminActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [showFeaturedModal, setShowFeaturedModal] = useState(false)

  async function handleClick() {
    if (loading || disabled) return

    // Si es "verificar", abrir modal de premium
    if (type === "verificar") {
      setShowVerifyModal(true)
      return
    }

    // Si es "foto_limite", abrir modal de límite de fotos
    if (type === "foto_limite") {
      setShowPhotosModal(true)
      return
    }

    // Si es "destacar", abrir modal de días de destacado
    if (type === "destacar") {
      setShowFeaturedModal(true)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/business/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la acción")
      }

      // Mostrar mensaje de éxito si existe
      if (data.message) {
        console.log("✅", data.message)
      }

      // Recargar la página para ver los cambios
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleClick}
          disabled={loading || disabled}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${
            loading || disabled
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          {loading ? "Procesando..." : label}
        </button>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Modal para verificar premium */}
      {type === "verificar" && (
        <VerifyPremiumModal
          businessId={id}
          businessName={businessName}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={() => {
            setShowVerifyModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* Modal para modificar límite de fotos */}
      {type === "foto_limite" && (
        <UpdatePhotosLimitModal
          businessId={id}
          businessName={businessName}
          currentLimit={currentMaxPhotos}
          isOpen={showPhotosModal}
          onClose={() => setShowPhotosModal(false)}
          onSuccess={() => {
            setShowPhotosModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* Modal para destacar negocio */}
      {type === "destacar" && (
        <FeaturedDaysModal
          businessId={id}
          businessName={businessName}
          isOpen={showFeaturedModal}
          onClose={() => setShowFeaturedModal(false)}
          onSuccess={() => {
            setShowFeaturedModal(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

