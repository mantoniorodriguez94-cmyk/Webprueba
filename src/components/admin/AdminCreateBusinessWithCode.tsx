"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LocationSelector from "@/components/LocationSelector"

interface AdminCreateBusinessWithCodeProps {
  onSuccess?: (businessId: string, code: string) => void
}

export default function AdminCreateBusinessWithCode({ onSuccess }: AdminCreateBusinessWithCodeProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  
  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [stateId, setStateId] = useState<number | null>(null)
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const [addressDetails, setAddressDetails] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setGeneratedCode("")

    // Validaciones básicas
    if (!name.trim()) {
      setError("El nombre del negocio es requerido")
      return
    }

    if (!stateId || !municipalityId) {
      setError("Estado y municipio son requeridos")
      return
    }

    setLoading(true)

    try {
      // Crear negocio sin owner_id (será NULL)
      const response = await fetch("/api/admin/business/create-with-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          state_id: stateId,
          municipality_id: municipalityId,
          address_details: addressDetails.trim() || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const code = data.data?.code || ""
        setGeneratedCode(code)
        setSuccess(`Negocio "${data.data?.business_name || name}" creado exitosamente`)
        
        // Reset form
        setName("")
        setDescription("")
        setCategory("")
        setAddress("")
        setPhone("")
        setWhatsapp("")
        setStateId(null)
        setMunicipalityId(null)
        setAddressDetails("")
        
        if (onSuccess) {
          onSuccess(data.data?.business_id || "", code)
        }
        
        // Ocultar formulario después de 5 segundos
        setTimeout(() => {
          setShowForm(false)
          setSuccess("")
          setGeneratedCode("")
        }, 5000)
      } else {
        setError(data.error || "Error al crear el negocio")
      }
    } catch (err: any) {
      console.error("Error creando negocio:", err)
      setError("Error de conexión. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
    } catch (err) {
      console.error("Error copiando código:", err)
    }
  }

  if (!showForm) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                <svg
                  className="w-6 h-6 text-emerald-400"
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
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-1">
                  Crear Negocio con Código de Reclamación
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Crea un negocio sin dueño y genera un código único para que el dueño real lo reclame cuando se registre
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 flex-shrink-0"
            >
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
              <span>Crear Negocio</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-1">
                Crear Negocio con Código de Reclamación
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Completa la información del negocio. Se generará automáticamente un código único para reclamación
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(false)
              setError("")
              setSuccess("")
              setGeneratedCode("")
            }}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 flex items-center justify-center transition-all flex-shrink-0 ml-4"
            title="Cerrar formulario"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 flex items-start gap-3">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 space-y-2">
              <p className="font-semibold">{success}</p>
              {generatedCode && (
                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-green-500/20">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Código generado</p>
                    <p className="text-xl font-mono font-bold text-green-300 tracking-wider">
                      {generatedCode}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="w-10 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 flex items-center justify-center transition-all"
                    title="Copiar código"
                  >
                    <svg
                      className="w-5 h-5 text-green-300"
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
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Ej: Café Aromas"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Ej: Restaurante, Tienda..."
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              placeholder="Descripción del negocio..."
              disabled={loading}
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Ubicación *
            </label>
            <LocationSelector
              selectedStateId={stateId}
              selectedMunicipalityId={municipalityId}
              onStateChange={setStateId}
              onMunicipalityChange={setMunicipalityId}
              disabled={loading}
              required={true}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Dirección Detallada
            </label>
            <input
              type="text"
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Punto de referencia, sector, etc."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Dirección (Opcional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Dirección completa"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="04121234567"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/20 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="04121234567"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creando...</span>
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
                  <span>Crear Negocio y Generar Código</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError("")
                setSuccess("")
                setGeneratedCode("")
              }}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-gray-300 hover:text-white font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
