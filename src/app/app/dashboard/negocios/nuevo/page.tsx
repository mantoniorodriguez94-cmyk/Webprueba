"use client"
import React, { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Simple ID generator (no need for uuid package)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function NuevoNegocioPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [description, setDescription] = useState("")
  const [logo, setLogo] = useState<File | null>(null)
  const [gallery, setGallery] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const uploadFile = async (file: File, folder: string) => {
    const id = generateId()
    const ext = file.name.split('.').pop()
    const path = `${folder}/${id}.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(path, file, { cacheControl: '3600', upsert: false })
      
    if (uploadError) throw uploadError
    
    const { data } = supabase.storage.from(folder).getPublicUrl(path)
    return data.publicUrl
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    
    setLoading(true)
    try {
      let logoUrl: string | null = null
      const galleryUrls: string[] = []

      if (logo) {
        logoUrl = await uploadFile(logo, "logos")
      }

      if (gallery && gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
          const f = gallery[i]
          const url = await uploadFile(f, "negocios-gallery")
          galleryUrls.push(url)
        }
      }

      const { error: insertError } = await supabase
        .from('businesses')
        .insert({
          nombre,
          description,
          logo_url: logoUrl,
          gallery_urls: galleryUrls
        })

      if (insertError) throw insertError

      router.push("/app/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al crear negocio")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/app/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2 group mb-4"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear nuevo negocio</h1>
          <p className="text-gray-600 mt-1">Completa la información de tu negocio</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 lg:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del negocio *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Panadería El Sol"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900"
                disabled={loading}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900 resize-none"
                disabled={loading}
              />
            </div>

            {/* Logo */}
            <div>
              <label htmlFor="logo" className="block text-sm font-semibold text-gray-700 mb-2">
                Logo (opcional)
              </label>
              <div className="relative">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={e => setLogo(e.target.files?.[0] ?? null)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E3F2FD] file:text-[#0288D1] hover:file:bg-[#BBDEFB]"
                  disabled={loading}
                />
              </div>
              {logo && (
                <p className="text-xs text-gray-500 mt-2">
                  Archivo seleccionado: {logo.name}
                </p>
              )}
            </div>

            {/* Galería */}
            <div>
              <label htmlFor="gallery" className="block text-sm font-semibold text-gray-700 mb-2">
                Galería de imágenes (opcional, múltiples)
              </label>
              <div className="relative">
                <input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setGallery(e.target.files)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E3F2FD] file:text-[#0288D1] hover:file:bg-[#BBDEFB]"
                  disabled={loading}
                />
              </div>
              {gallery && gallery.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {gallery.length} archivo(s) seleccionado(s)
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white font-semibold py-3 px-6 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </span>
                ) : (
                  "Crear negocio"
                )}
              </button>
              <Link
                href="/app/dashboard"
                className="flex-1 text-center border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
