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
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
        {/* Animación de celebración */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 animate-bounce">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          ¡Negocio Reclamado Exitosamente!
        </h2>
        <p className="text-xl text-green-300 mb-2">
          Has reclamado <strong>{businessName}</strong>
        </p>
        <p className="text-gray-300 mb-6">
          Ahora eres el dueño oficial y fundador de este negocio.
        </p>
        
        {/* Badge de fundador */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold mb-6">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>Negocio Fundador</span>
        </div>

        <p className="text-sm text-gray-400">
          Redirigiendo a tu panel de gestión...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
          <svg
            className="w-8 h-8 text-blue-400"
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
        <h2 className="text-3xl font-bold text-white mb-2">
          Reclamar Mi Negocio
        </h2>
        <p className="text-gray-400">
          Ingresa el código de invitación que recibiste para reclamar tu negocio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-semibold text-gray-300 mb-2"
          >
            Código de Reclamación
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENC-XXXX"
            className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all font-mono text-lg tracking-wider text-center"
            disabled={loading}
            maxLength={10}
          />
          <p className="mt-2 text-xs text-gray-500">
            Formato: ENC- seguido de 4 caracteres (ej: ENC-A9B2)
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Reclamando...
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
              Reclamar Negocio
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/20">
        <p className="text-xs text-gray-500 text-center">
          ¿No tienes un código?{" "}
          <Link
            href="/app/dashboard/negocios/nuevo"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Crea un negocio desde cero
          </Link>
        </p>
      </div>
    </div>
  )
}

