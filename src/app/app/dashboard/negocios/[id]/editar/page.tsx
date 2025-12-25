"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import LocationSelector from "@/components/business/LocationSelector"
import NotificationModal from "@/components/ui/NotificationModal"

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
  const [stateId, setStateId] = useState<number | null>(null)
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const [addressDetails, setAddressDetails] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [showMapModal, setShowMapModal] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [galleryError, setGalleryError] = useState("")
  
  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: "success" | "error" | "warning" | "info"
    title?: string
    message: string
  }>({
    isOpen: false,
    type: "info",
    message: "",
  })

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string
  ) => {
    setNotification({ isOpen: true, type, message, title })
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  // Verificar permisos
  const isOwner = user?.id === negocio?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canEdit = isOwner || isAdmin
  
  // Verificar si el negocio es premium activo
  const isPremiumActive = negocio?.is_premium === true && 
                         negocio?.premium_until && 
                         new Date(negocio.premium_until) > new Date()
  
  // Límites de imágenes según plan
  const MAX_IMAGES_FREE = 3
  const MAX_IMAGES_PREMIUM = 10
  const maxImages = isPremiumActive ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE

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
          showNotification("error", "No tienes permiso para editar este negocio", "Acceso denegado")
          setTimeout(() => router.push("/app/dashboard"), 2000)
          return
        }

        setNegocio(data)
        setName(data.name)
        setDescription(data.description ?? "")
        setCategory(data.category ?? "")
        setStateId(data.state_id ?? null)
        setMunicipalityId(data.municipality_id ?? null)
        setAddressDetails(data.address_details ?? "")
        setAddress(data.address ?? "")
        setPhone(data.phone ? String(data.phone) : "")
        setWhatsapp(data.whatsapp ? String(data.whatsapp) : "")
        setLatitude(data.latitude ? String(data.latitude) : "")
        setLongitude(data.longitude ? String(data.longitude) : "")
      } catch (err: any) {
        console.error("Error cargando negocio:", err)
        showNotification("error", "No se pudo cargar la información del negocio", "Error de carga")
        setTimeout(() => router.push("/app/dashboard"), 2000)
      } finally {
        setLoading(false)
      }
    }
    
    fetchNegocio()
  }, [id, user, router])

  // Callbacks memoizados para LocationSelector (previene renders infinitos)
  const handleStateChange = useCallback((id: number | null, name: string) => {
    setStateId(id)
  }, [])

  const handleMunicipalityChange = useCallback((id: number | null, name: string) => {
    setMunicipalityId(id)
  }, [])

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

  // Manejador de cambio de galería con validación
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setGalleryError("")
    
    if (files && files.length > 0) {
      // Calcular total: imágenes existentes + nuevas
      const currentImageCount = galleryUrls.length
      const totalImages = currentImageCount + files.length
      
      if (totalImages > maxImages) {
        setGalleryError(
          isPremiumActive 
            ? `⚠️ Límite premium: máximo ${MAX_IMAGES_PREMIUM} imágenes totales. Ya tienes ${currentImageCount}, puedes agregar ${maxImages - currentImageCount} más.`
            : `⚠️ Límite gratuito: máximo ${MAX_IMAGES_FREE} imágenes. Ya tienes ${currentImageCount}, puedes agregar ${maxImages - currentImageCount} más. ⭐ Con Premium puedes subir hasta ${MAX_IMAGES_PREMIUM} imágenes.`
        )
        e.target.value = "" // Limpiar selección
        setGalleryFiles(null)
      } else {
        setGalleryFiles(files)
      }
    } else {
      setGalleryFiles(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!negocio) return
    
    setError("")
    
    // Validar ubicación: estado y municipio son obligatorios
    if (!stateId || !municipalityId) {
      setError("⚠️ Debes seleccionar Estado y Municipio")
      return
    }
    
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
          state_id: stateId,
          municipality_id: municipalityId,
          address_details: addressDetails || null,
          address: address || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          logo_url: logoUrl,
          gallery_urls: gallery.length > 0 ? gallery : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null
        })
        .eq('id', negocio.id)

      if (updateError) throw updateError
      
      showNotification("success", "Los cambios se guardaron exitosamente", "¡Negocio actualizado!")
      setTimeout(() => router.push(`/app/dashboard/negocios/${negocio.id}`), 1500)
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
        <div className="text-center bg-transparent backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!negocio || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso denegado</h2>
          <p className="text-gray-300 mb-6">No tienes permiso para editar este negocio</p>
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
      <header className="bg-transparent backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/app/dashboard')}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Volver al Dashboard"
            >
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl  sm:text-3xl font-bold text-white flex items-center gap-2">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Editar Negocio
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                {negocio.name} • Configuración General
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Card */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20/40 p-6 sm:p-8 lg:p-10">
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
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Nombre del negocio *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-white mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500 resize-none pb-20 sm:pb-3"
                disabled={loading}
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-white mb-2">
                Categoría
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Panadería, Restaurante, Tienda..."
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Ubicación del Negocio */}
            <div className="space-y-4 p-4 bg-blue-500/10 rounded-2xl border-2 border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-bold text-white">Ubicación del Negocio *</h3>
              </div>

              {/* Selector de Estado y Municipio */}
              <LocationSelector
                selectedStateId={stateId}
                selectedMunicipalityId={municipalityId}
                onStateChange={handleStateChange}
                onMunicipalityChange={handleMunicipalityChange}
                required={true}
                disabled={loading}
              />

              {/* Detalles de dirección (opcional) */}
              <div>
                <label htmlFor="addressDetails" className="block text-sm font-medium text-gray-200 mb-2">
                  Punto de referencia o detalles adicionales (Opcional)
                </label>
                <input
                  id="addressDetails"
                  type="text"
                  value={addressDetails}
                  onChange={e => setAddressDetails(e.target.value)}
                  placeholder="Ej: Al lado del banco, frente a la plaza"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>

              {/* Sección Opcional: Dirección completa y GPS */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-300">Información adicional</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">(Opcional)</span>
                </div>

                {/* Dirección completa */}
                <div className="mb-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                    📍 Dirección completa (Opcional)
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Calle Principal #123"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    disabled={loading}
                  />
                </div>

                {/* Coordenadas GPS */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🗺️ Ubicación GPS - Coordenadas (Opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">
                        Latitud
                      </label>
                      <input
                        id="latitude"
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="Ej: 4.6097"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm placeholder:text-gray-500"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">
                        Longitud
                      </label>
                      <input
                        id="longitude"
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="Ej: -74.0817"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm placeholder:text-gray-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl transition-all border border-white/20"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Actualizar en mapa
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Opcional: Actualiza tu ubicación exacta en el mapa
                  </p>
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-white mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-white mb-2">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Logo actual */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
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
              <label htmlFor="logo" className="block text-sm font-semibold text-white mb-2">
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
              <label className="block text-sm font-semibold text-white mb-2">
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
                className="flex-1 text-center border-2 border-gray-300 text-gray-100 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-700 transition-colors"
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

      {/* Modal de Mapa */}
      {showMapModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowMapModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-gray-900 rounded-3xl p-6 max-w-lg mx-auto animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">📍 Actualizar Ubicación GPS</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-all"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-400">
                Obtén tu ubicación actual o ingresa las coordenadas manualmente
              </p>
            </div>

            {/* Opción 1: Obtener ubicación actual */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLatitude(position.coords.latitude.toFixed(6))
                        setLongitude(position.coords.longitude.toFixed(6))
                        setShowMapModal(false)
                        showNotification("success", "Tu ubicación GPS ha sido detectada correctamente", "¡Ubicación obtenida!")
                      },
                      (error) => {
                        console.error("Error obteniendo ubicación:", error)
                        showNotification("warning", "No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.", "Ubicación no disponible")
                      }
                    )
                  } else {
                    showNotification("warning", "Tu navegador no soporta geolocalización", "Función no disponible")
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar mi ubicación actual
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Detectará automáticamente tu posición GPS
              </p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-xs font-semibold text-gray-400">O ingresa manualmente</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {/* Opción 2: Ingresar coordenadas manualmente */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ej: 4.6097"
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ej: -74.0817"
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-gray-500"
                />
              </div>

              {/* Vista previa de Mapa */}
              {latitude && longitude && (
                <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <p className="text-sm font-semibold text-gray-200 mb-2">Vista previa:</p>
                  <div className="bg-gray-700 rounded-xl overflow-hidden">
                    <iframe
                      title="Mapa de ubicación"
                      width="100%"
                      height="200"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude},${latitude},${longitude},${latitude}&layer=mapnik&marker=${latitude},${longitude}`}
                      className="w-full"
                    ></iframe>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    📍 Lat: {latitude}, Lng: {longitude}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLatitude("")
                    setLongitude("")
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-2xl transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Ayuda */}
            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-800/50 rounded-2xl">
              <p className="text-xs text-blue-300">
                💡 <strong>Tip:</strong> Puedes obtener las coordenadas de cualquier lugar abriendo Google Maps, 
                haciendo clic derecho en el lugar y seleccionando las coordenadas que aparecen.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
