"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ClaimBusinessForm() {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
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

  // Si está colapsado, mostrar solo el botón
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full surface rounded-3xl border-2 border-blue-200 p-5 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <svg
              className="w-6 h-6 text-blue-500"
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
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-ink text-lg">Reclama tu negocio aquí!</h3>
            <p className="text-sm text-ink-2 mt-0.5">Usa tu código de invitación para reclamar tu negocio</p>
          </div>
        </div>
        <svg 
          className="w-6 h-6 text-blue-500 group-hover:text-blue-600 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  // Si está expandido, mostrar el formulario completo
  if (success) {
    return (
      <div className="max-w-md mx-auto surface rounded-3xl shadow-sm p-8">
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
            <h2 className="text-2xl font-bold text-ink">
              ¡Negocio Reclamado Exitosamente!
            </h2>
            <p className="text-lg text-green-600 font-medium">
              {businessName}
            </p>
            <p className="text-sm text-ink-2">
              Ahora eres el dueño oficial y fundador de este negocio
            </p>
          </div>
          
          {/* Badge de fundador */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Negocio Fundador</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-2/70">
            <div className="h-1 w-1 rounded-full bg-ink-2/70 animate-pulse"></div>
            <span>Redirigiendo a tu panel de gestión...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto surface rounded-3xl shadow-sm overflow-hidden">
      {/* Card Header con botón de minimizar */}
      <div className="p-6 pb-4 border-b border-black/8">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-200">
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
              <h3 className="text-xl font-bold text-ink mb-1">
                Reclama la propiedad de tu negocio
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Introduce el código de invitación que recibiste para acceder a tu panel de control
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 hover:border-black/15 flex items-center justify-center transition-all flex-shrink-0 ml-4"
            title="Minimizar"
          >
            <svg 
              className="w-5 h-5 text-ink-2 hover:text-ink transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="claim-code"
              className="block text-sm font-semibold text-ink-2"
            >
              Código de Reclamación
            </label>
            <input
              id="claim-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENC-XXXX"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-paper-2 border-2 border-black/15 dark:border-white/15 text-ink placeholder-ink-2/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-lg tracking-wider text-center"
              disabled={loading}
              maxLength={10}
              autoComplete="off"
            />
            <p className="text-xs text-ink-2/70 text-center">
              Formato: ENC- seguido de 4 caracteres (ej: ENC-A9B2)
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
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
            className="w-full px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div className="pt-4 border-t border-black/8">
          <p className="text-xs text-ink-2/70 text-center">
            ¿No tienes un código?{" "}
            <Link
              href="/app/dashboard/negocios/nuevo"
              className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
            >
              Crea un negocio desde cero
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
