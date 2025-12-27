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
    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
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
        <div>
          <h3 className="text-xl font-bold text-white">Código de Reclamación</h3>
          <p className="text-sm text-gray-400">
            Genera un código único para que el dueño reclame este negocio
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      ) : code ? (
        <div className="space-y-4">
          {/* Código generado */}
          <div className="bg-black/30 rounded-2xl p-4 border-2 border-blue-500/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Código de Reclamación</p>
                <p className="text-2xl font-mono font-bold text-blue-400 tracking-wider">
                  {code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-green-500/20 text-green-300 border border-green-500/40"
                    : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40"
                }`}
              >
                {copied ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copiado
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <p className="text-sm text-blue-200">
              <strong>Instrucciones:</strong> Comparte este código con el dueño del negocio. 
              Ellos podrán usarlo para reclamar el negocio cuando se registren en la plataforma.
            </p>
          </div>

          {/* Botón para regenerar */}
          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="w-full px-4 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                Generando...
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
                Regenerar Código
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            No hay un código de reclamación generado para este negocio.
          </p>
          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generando...
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
                Generar Código de Reclamación
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

