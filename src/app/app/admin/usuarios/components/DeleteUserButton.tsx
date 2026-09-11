"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteUserButtonProps {
  userId: string
  userName: string
  userEmail: string
}

export default function DeleteUserButton({ userId, userName, userEmail }: DeleteUserButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario")
      }

      // Cerrar modal y recargar la página
      setShowConfirm(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
      >
        Eliminar
      </button>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setShowConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-black/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-ink">
                  Eliminar Usuario
                </h2>
              </div>
              <p className="text-sm text-ink-2">
                Esta acción es permanente y no se puede deshacer.
              </p>
            </div>

            {/* Información del usuario */}
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-ink-2 mb-1">
                <span className="font-semibold">Nombre:</span> {userName}
              </p>
              <p className="text-sm text-ink-2">
                <span className="font-semibold">Email:</span> {userEmail}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Advertencia */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                ⚠️ Se eliminará:
              </p>
              <ul className="text-xs text-amber-700/80 mt-1 ml-4 list-disc">
                <li>El perfil del usuario de la base de datos</li>
                <li>La cuenta de autenticación</li>
                <li>Todos los datos asociados</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black/5 hover:bg-black/10 text-ink rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

