"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"
// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

type Negocio = {
  id: string
  nombre: string
  description?: string
  logo_url?: string
  gallery_urls?: string[]
}

export default function EditarNegocioPage() {
  const params = useParams()
  const id = (params as any)?.id as string
  const router = useRouter()
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    const fetchNegocio = async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single()
        
      if (error) {
        alert(error.message)
        return
      }
      setNegocio(data)
      setNombre(data.nombre)
      setDescripcion(data.description ?? "")
    }
    fetchNegocio()
  }, [id])

  const uploadFile = async (file: File, folder: string) => {
    const idd = generateId()
    const ext = file.name.split('.').pop()
    const path = `${folder}/${idd}.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(path, file, { cacheControl: '3600', upsert: false })
      
    if (uploadError) throw uploadError
    
    const { data } = supabase.storage.from(folder).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!negocio) return
    
    setError("")
    setLoading(true)
    
    try {
      let logoUrl = negocio.logo_url ?? null
      const gallery = negocio.gallery_urls ? [...negocio.gallery_urls] : []

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "logos")
      }

      if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const f = galleryFiles[i]
          const url = await uploadFile(f, "negocios-gallery")
          gallery.push(url)
        }
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          nombre,
          descripcion,
          logo_url: logoUrl,
          gallery_urls: gallery
        })
        .eq('id', negocio.id)

      if (updateError) throw updateError
      
      alert("Negocio actualizado correctamente")
      router.push("/app/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al guardar")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!negocio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Editar negocio</h1>
          <p className="text-gray-600 mt-1">{negocio.nombre}</p>
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

          <form onSubmit={handleSave} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del negocio *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
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
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900 resize-none"
                disabled={loading}
              />
            </div>

            {/* Logo actual */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logo actual
              </label>
              {negocio.logo_url ? (
                <Image 
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${negocio.logo_url}`}
                  alt="Logo actual" 
                  className="w-32 h-32 object-cover rounded-2xl mb-3 border-2 border-gray-200"
                  width={100}
                  height={100}
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-2xl mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sin logo</span>
                </div>
              )}
              <label htmlFor="logo" className="block text-sm font-semibold text-gray-700 mb-2">
                Subir nuevo logo (opcional)
              </label>
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E3F2FD] file:text-[#0288D1] hover:file:bg-[#BBDEFB]"
                disabled={loading}
              />
            </div>

            {/* Galería */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Galería actual
              </label>
              {negocio.gallery_urls && negocio.gallery_urls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {negocio.gallery_urls.map((url, idx) => (
                    <Image 
                      key={idx}
                      src={url} 
                      alt={`Imagen ${idx + 1}`} 
                      className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">No hay imágenes en la galería</p>
              )}
              <label htmlFor="gallery" className="block text-sm font-semibold text-gray-700 mb-2">
                Agregar más imágenes (opcional)
              </label>
              <input
                id="gallery"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryFiles(e.target.files)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E3F2FD] file:text-[#0288D1] hover:file:bg-[#BBDEFB]"
                disabled={loading}
              />
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
                    Guardando...
                  </span>
                ) : (
                  "Guardar cambios"
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
