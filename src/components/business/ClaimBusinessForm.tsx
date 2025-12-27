"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ClaimBusinessForm() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [businessName, setBusinessName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!code.trim()) {
      setError("Por favor ingresa el código")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/business/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setBusinessName(data.data?.business_name || "tu negocio")
        
        // Redirigir al panel de gestión del negocio después de 2 segundos
        setTimeout(() => {
          if (data.data?.business_id) {
            router.push(`/app/dashboard/negocios/${data.data.business_id}/gestionar`)
          } else {
            router.push("/app/dashboard/negocios")
          }
        }, 2000)
      } else {
        setError(data.error || "Error al reclamar el negocio")
      }
    } catch (err: any) {
      console.error("Error reclamando negocio:", err)
      setError("Error de conexión. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-8">
        {/* Animación de celebración */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/50 animate-bounce">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-400/30 animate-ping"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              ¡Negocio Reclamado Exitosamente!
            </h2>
            <p className="text-lg text-green-300 font-medium">
              {businessName}
            </p>
            <p className="text-sm text-gray-400">
              Ahora eres el dueño oficial y fundador de este negocio
            </p>
          </div>
          
          {/* Badge de fundador */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/40 text-yellow-300 font-semibold">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Negocio Fundador</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="h-1 w-1 rounded-full bg-gray-500 animate-pulse"></div>
            <span>Redirigiendo a tu panel de gestión...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1">
              Reclama la propiedad de tu negocio
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Introduce el código de invitación que recibiste para acceder a tu panel de control
            </p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="claim-code"
              className="block text-sm font-semibold text-gray-300"
            >
              Código de Reclamación
            </label>
            <input
              id="claim-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENC-XXXX"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-lg tracking-wider text-center"
              disabled={loading}
              maxLength={10}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 text-center">
              Formato: ENC- seguido de 4 caracteres (ej: ENC-A9B2)
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Reclamando...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Reclamar Negocio</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            ¿No tienes un código?{" "}
            <Link
              href="/app/dashboard/negocios/nuevo"
              className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
            >
              Crea un negocio desde cero
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
