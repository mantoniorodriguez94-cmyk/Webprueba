"use client"

import { useState, useEffect, useCallback } from "react"

interface BusinessClaimCodeSectionProps {
  businessId: string
  businessName: string
}

export default function BusinessClaimCodeSection({
  businessId,
  businessName
}: BusinessClaimCodeSectionProps) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const loadExistingCode = useCallback(async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/admin/business/generate-claim-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCode(data.data.code)
      } else if (response.status !== 404) {
        setError(data.error || "Error al cargar código")
      }
    } catch (err: any) {
      console.error("Error cargando código:", err)
      setError("Error al cargar código existente")
    } finally {
      setLoading(false)
    }
  }, [businessId])

  // Cargar código existente al montar
  useEffect(() => {
    loadExistingCode()
  }, [loadExistingCode])

  const handleGenerateCode = async () => {
    setGenerating(true)
    setError("")
    setCopied(false)

    try {
      const response = await fetch("/api/admin/business/generate-claim-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCode(data.data.code)
      } else {
        setError(data.error || "Error al generar código")
      }
    } catch (err: any) {
      console.error("Error generando código:", err)
      setError("Error al generar código")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = async () => {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copiando código:", err)
      setError("No se pudo copiar el código")
    }
  }

  return (
    <div className="surface rounded-3xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b border-black/8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-200">
            <svg
              className="w-6 h-6 text-purple-600"
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
              Acceso de Patrocina & Invitación
            </h3>
            <p className="text-sm text-ink-2 leading-relaxed">
              Genera un código único para que el dueño real reclame este negocio cuando se registre
            </p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent"></div>
          </div>
        ) : code ? (
          <div className="space-y-5">
            {/* Código generado - Diseño Premium */}
            <div className="relative">
              <div className="bg-purple-50/40 rounded-2xl p-5 border-2 border-purple-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-2 mb-2 uppercase tracking-wider">
                      Código de Reclamación
                    </p>
                    <p className="text-3xl font-mono font-bold text-purple-700 tracking-widest break-all">
                      {code}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="group relative w-10 h-10 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-200 hover:border-purple-300 flex items-center justify-center transition-all flex-shrink-0"
                    title={copied ? "Copiado!" : "Copiar código"}
                  >
                    {copied ? (
                      <svg
                        className="w-5 h-5 text-green-600"
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
                    ) : (
                      <svg
                        className="w-5 h-5 text-purple-600 group-hover:text-purple-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong className="font-semibold">Instrucciones:</strong> Comparte este código con el dueño del negocio. 
                  Ellos podrán usarlo para reclamar el negocio cuando se registren en la plataforma.
                </p>
              </div>
            </div>

            {/* Botón para regenerar - Estilo secundario */}
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full px-4 py-3 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 hover:border-black/15 text-ink-2 hover:text-ink font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/20 border-t-transparent"></div>
                  <span>Regenerando...</span>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Regenerar Código</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/5 border border-black/10 mb-2">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <div className="space-y-2">
              <p className="text-ink-2 font-medium">
                No hay un código de reclamación generado para este negocio
              </p>
              <p className="text-sm text-ink-2/70">
                Genera un código único para compartir con el dueño
              </p>
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Generando...</span>
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Generar Código de Reclamación</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
