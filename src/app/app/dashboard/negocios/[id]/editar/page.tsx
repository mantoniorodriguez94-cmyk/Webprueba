"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function EditarNegocioPage() {
  const params = useParams()
  const id = (params as any)?.id as string
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  
  const [negocio, setNegocio] = useState<Business | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Verificar permisos
  const isOwner = user?.id === negocio?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canEdit = isOwner || isAdmin

  // Parsear gallery_urls de manera segura
  const getGalleryUrls = (): string[] => {
    if (!negocio?.gallery_urls) return []
    
    if (Array.isArray(negocio.gallery_urls)) {
      return negocio.gallery_urls
    }
    
    if (typeof negocio.gallery_urls === 'string') {
      try {
        const parsed = JSON.parse(negocio.gallery_urls)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    
    return []
  }

  const galleryUrls = getGalleryUrls()

  useEffect(() => {
    if (!id || !user) return
    
    const fetchNegocio = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .single()
          
        if (error) throw error

        // Verificar permisos
        const hasPermission = data.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          alert("No tienes permiso para editar este negocio")
          router.push("/app/dashboard")
          return
        }

        setNegocio(data)
        setName(data.name)
        setDescription(data.description ?? "")
        setCategory(data.category ?? "")
        setAddress(data.address ?? "")
        setPhone(data.phone ? String(data.phone) : "")
        setWhatsapp(data.whatsapp ? String(data.whatsapp) : "")
      } catch (err: any) {
        console.error("Error cargando negocio:", err)
        alert("Error cargando el negocio")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }
    
    fetchNegocio()
  }, [id, user, router])

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
    setSaving(true)
    
    try {
      let logoUrl = negocio.logo_url ?? null
      const gallery = [...galleryUrls]

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "logos")
      }

      if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const f = galleryFiles[i]
          const url = await uploadFile(f, "business-gallery")
          gallery.push(url)
        }
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          name,
          description: description || null,
          category: category || null,
          address: address || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          logo_url: logoUrl,
          gallery_urls: gallery.length > 0 ? gallery : null
        })
        .eq('id', negocio.id)

      if (updateError) throw updateError
      
      alert("✅ Negocio actualizado correctamente")
      router.push(`/app/dashboard/negocios/${negocio.id}`)
    } catch (err: any) {
      setError(err.message || "Error al guardar")
      console.error("Error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!negocio || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso denegado</h2>
          <p className="text-gray-600 mb-6">No tienes permiso para editar este negocio</p>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-[#0288D1]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/app/dashboard/negocios/${negocio.id}`}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Volver"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Editar Negocio
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {negocio.name} • Configuración General
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6 sm:p-8 lg:p-10">
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
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del negocio *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900 resize-none"
                disabled={loading}
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Panadería, Restaurante, Tienda..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900"
                disabled={loading}
              />
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Dirección
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Calle Principal #123"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900"
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900"
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900"
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
                  src={negocio.logo_url}
                  alt="Logo actual" 
                  className="w-32 h-32 object-cover rounded-2xl mb-3 border-2 border-gray-200"
                  width={128}
                  height={128}
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
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200">
                      <Image 
                        src={url} 
                        alt={`Imagen ${idx + 1}`} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">No hay imágenes en la galería</p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Para gestionar tu galería completa (agregar/eliminar fotos), usa la sección{" "}
                    <Link href={`/app/dashboard/negocios/${negocio.id}/galeria`} className="underline font-semibold hover:text-blue-900">
                      Gestionar Galería
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href={`/app/dashboard/negocios/${negocio.id}`}
                className="flex-1 text-center border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white font-semibold py-3 px-6 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
