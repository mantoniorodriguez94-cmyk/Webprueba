"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LocationSelector from "@/components/LocationSelector"

// Simple ID generator (no need for uuid package)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function NuevoNegocioPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [logo, setLogo] = useState<File | null>(null)
  const [gallery, setGallery] = useState<FileList | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [showMapModal, setShowMapModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [galleryError, setGalleryError] = useState("")
  // Ubicación (Estado y Municipio)
  const [stateId, setStateId] = useState<number | null>(null)
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const [addressDetails, setAddressDetails] = useState("")
  
  // Límites de imágenes según plan
  const MAX_IMAGES_FREE = 3
  const MAX_IMAGES_PREMIUM = 10
  const maxImages = isPremium ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE
  
  // Verificar límite de negocios al cargar la página
  useEffect(() => {
    const checkBusinessLimit = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/app/auth/login")
          return
        }
        
        // Verificar si el usuario es tipo company
        const userRole = user.user_metadata?.role ?? "person"
        if (userRole !== "company") {
          alert("⚠️ Para crear negocios, necesitas una cuenta tipo Empresa.")
          router.push("/app/dashboard")
          return
        }
        
        // Verificar si tiene algún negocio premium activo
        const { data: businesses } = await supabase
          .from("businesses")
          .select("is_premium, premium_until")
          .eq("owner_id", user.id)
        
        const hasPremiumBusiness = businesses?.some(b => 
          b.is_premium === true && 
          b.premium_until && 
          new Date(b.premium_until) > new Date()
        ) ?? false
        
        setIsPremium(hasPremiumBusiness)
        
        // Verificar si es administrador (sin límites)
        const isAdmin = user.user_metadata?.is_admin ?? false
        
        // Si NO es admin, aplicar límites
        if (!isAdmin) {
          // Obtener el límite permitido
          const isPremium = user.user_metadata?.is_premium ?? false
          const allowedBusinesses = user.user_metadata?.allowed_businesses ?? 1
          
          // Contar cuántos negocios tiene actualmente
          const { data: businesses, error: fetchError } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", user.id)
          
          if (fetchError) throw fetchError
          
          const currentCount = businesses?.length ?? 0
          
          // Si ya alcanzó el límite, mostrar alerta premium
          if (currentCount >= allowedBusinesses) {
            if (!isPremium) {
              alert("⭐ Para crear más negocios, únete al Plan Premium.\n\n✨ Beneficios Premium:\n• Crear de 2 a 5 negocios\n• 1 semana en Destacados\n• Borde dorado especial\n\nPrecio: $5 USD/mes")
            } else {
              alert("⚠️ Has alcanzado el límite de negocios de tu plan Premium.")
            }
            router.push("/app/dashboard/mis-negocios")
            return
          }
        }
        
        setChecking(false)
      } catch (err) {
        console.error("Error verificando límite:", err)
        setChecking(false)
      }
    }
    
    checkBusinessLimit()
  }, [router])

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

  // Manejador de cambio de galería con validación
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setGalleryError("")
    
    if (files && files.length > 0) {
      if (files.length > maxImages) {
        setGalleryError(
          isPremium 
            ? `⚠️ Límite premium: máximo ${MAX_IMAGES_PREMIUM} imágenes. Seleccionaste ${files.length}.`
            : `⚠️ Límite gratuito: máximo ${MAX_IMAGES_FREE} imágenes. ⭐ Con Premium puedes subir hasta ${MAX_IMAGES_PREMIUM} imágenes.`
        )
        e.target.value = "" // Limpiar selección
        setGallery(null)
      } else {
        setGallery(files)
      }
    } else {
      setGallery(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validación: Nombre obligatorio y longitud mínima
    if (!name.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    
    if (name.trim().length < 3) {
      setError("El nombre del negocio debe tener al menos 3 caracteres")
      return
    }
    
    if (name.trim().length > 100) {
      setError("El nombre del negocio no puede exceder 100 caracteres")
      return
    }
    
    // Validación: Descripción razonable (si se proporciona)
    if (description.trim().length > 0 && description.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres o dejarse vacía")
      return
    }
    
    if (description.trim().length > 1000) {
      setError("La descripción no puede exceder 1000 caracteres")
      return
    }
    
    // Validar que estado y municipio estén seleccionados (obligatorio)
    if (!stateId || !municipalityId) {
      setError("⚠️ Debes seleccionar el Estado y el Municipio donde se encuentra tu negocio")
      return
    }
    
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Debes iniciar sesión para crear un negocio")
        setLoading(false)
        return
      }

      // Verificar rol de usuario
      const userRole = user.user_metadata?.role ?? "person"
      if (userRole !== "company") {
        setError("⚠️ Solo las cuentas tipo Empresa pueden crear negocios")
        setLoading(false)
        return
      }

      // Verificar límite de negocios (validación anti-spam)
      const isAdmin = user.user_metadata?.is_admin ?? false
      if (!isAdmin) {
        // Contar negocios actuales del usuario
        const { data: existingBusinesses, error: countError } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", user.id)
        
        if (countError) throw countError
        
        const currentCount = existingBusinesses?.length ?? 0
        const allowedBusinesses = user.user_metadata?.allowed_businesses ?? 1
        
        // Verificar límite
        if (currentCount >= allowedBusinesses) {
          setError(`⚠️ Has alcanzado el límite de ${allowedBusinesses} ${allowedBusinesses === 1 ? 'negocio' : 'negocios'} de tu plan. ⭐ Mejora a Premium para crear más negocios.`)
          setLoading(false)
          return
        }
        
        // Prevenir spam: verificar si ya existe un negocio con el mismo nombre (del mismo usuario)
        const nameNormalized = name.trim().toLowerCase()
        const duplicateExists = existingBusinesses?.some(b => 
          b.name.trim().toLowerCase() === nameNormalized
        )
        
        if (duplicateExists) {
          setError("⚠️ Ya tienes un negocio con este nombre. Por favor, usa un nombre diferente.")
          setLoading(false)
          return
        }
      }

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
          owner_id: user.id,
          name,
          description: description || null,
          category: category || null,
          address: address || null,
          address_details: addressDetails.trim() || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          logo_url: logoUrl,
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          state_id: stateId,
          municipality_id: municipalityId
        })

      if (insertError) throw insertError

      // Usar window.location para forzar recarga completa y asegurar que los datos se actualicen
      window.location.href = "/app/dashboard"
    } catch (err: any) {
      setError(err.message || "Error al crear negocio")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading mientras se verifica el límite
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 group mb-4"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-3xl font-bold text-white">Crear nuevo negocio</h1>
          <p className="text-gray-300 mt-1">Completa la información de tu negocio</p>
        </div>

        {/* Form Card */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8 lg:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Nombre del negocio *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Panadería El Sol"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
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
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                rows={4}
                  className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500 resize-none pb-20 sm:pb-3"
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
                onChange={e => setCategory(e.target.value)}
                placeholder="Ej: Panadería, Restaurante, Tienda..."
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Ubicación: Estado y Municipio (Obligatorio) */}
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
                onStateChange={setStateId}
                onMunicipalityChange={setMunicipalityId}
                disabled={loading}
                required={true}
              />

              {/* Detalles adicionales de dirección (opcional) */}
              <div>
                <label htmlFor="addressDetails" className="block text-sm font-semibold text-white mb-2">
                  Detalles adicionales de dirección (opcional)
                </label>
                <input
                  id="addressDetails"
                  type="text"
                  value={addressDetails}
                  onChange={e => setAddressDetails(e.target.value)}
                  placeholder="Ej: Calle Principal #123, Sector Los Pinos, Punto de referencia..."
                  className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Información adicional para ayudar a los clientes a encontrarte
                </p>
              </div>
            </div>

            {/* Ubicación GPS (Opcional) */}
            <div className="space-y-4 p-4 bg-gray-500/10 rounded-2xl border-2 border-gray-500/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="font-bold text-gray-400">
                  Ubicación GPS (Opcional)
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  🗺️ Coordenadas GPS para ubicación precisa
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
                      onChange={e => setLatitude(e.target.value)}
                      placeholder="Ej: 4.6097"
                      className="w-full px-3 py-2 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm placeholder:text-gray-500"
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
                      onChange={e => setLongitude(e.target.value)}
                      placeholder="Ej: -74.0817"
                      className="w-full px-3 py-2 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm placeholder:text-gray-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {latitude && longitude && (
                  <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Coordenadas GPS completadas
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2.5 px-4 rounded-xl transition-all"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Colocar ubicación en mapa
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Haz clic para seleccionar tu ubicación en un mapa interactivo
                </p>
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
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
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
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Logo */}
            <div>
              <label htmlFor="logo" className="block text-sm font-semibold text-white mb-2">
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
              <label htmlFor="gallery" className="block text-sm font-semibold text-white mb-2 flex items-center justify-between">
                <span>Galería de imágenes (opcional)</span>
                <span className={`text-xs font-normal ${isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {isPremium ? `⭐ Premium: hasta ${MAX_IMAGES_PREMIUM}` : `Máx: ${MAX_IMAGES_FREE} (⭐ Premium: ${MAX_IMAGES_PREMIUM})`}
                </span>
              </label>
              <div className="relative">
                <input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E3F2FD] file:text-[#0288D1] hover:file:bg-[#BBDEFB]"
                  disabled={loading}
                />
              </div>
              
              {/* Mensaje de error si excede el límite */}
              {galleryError && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400 font-medium">{galleryError}</p>
                </div>
              )}
              
              {/* Contador de archivos seleccionados */}
              {gallery && gallery.length > 0 && (
                <p className={`text-xs mt-2 ${gallery.length === maxImages ? 'text-yellow-400 font-semibold' : 'text-gray-400'}`}>
                  ✓ {gallery.length} de {maxImages} imagen{gallery.length !== 1 ? 'es' : ''} seleccionada{gallery.length !== 1 ? 's' : ''}
                  {!isPremium && (
                    <Link href="/app/dashboard/perfil" className="ml-2 text-yellow-400 hover:text-yellow-300 underline">
                      ⭐ Mejora a Premium
                    </Link>
                  )}
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
                className="flex-1 text-center border-2 border-gray-300 text-white hover:text-gray-100 font-semibold py-3 px-6 rounded-2xl hover:bg-white/10 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </Link>
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
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 max-w-lg mx-auto animate-fade-in max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">📍 Seleccionar Ubicación GPS</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <svg className="w-6 h-6 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-300">
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
                        alert("✅ Ubicación obtenida exitosamente!")
                        setShowMapModal(false)
                      },
                      (error) => {
                        console.error("Error obteniendo ubicación:", error)
                        alert("⚠️ No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.")
                      }
                    )
                  } else {
                    alert("⚠️ Tu navegador no soporta geolocalización")
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
              <p className="text-xs text-gray-600 mt-2 text-center">
                Detectará automáticamente tu posición GPS
              </p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs font-semibold text-gray-600">O ingresa manualmente</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Opción 2: Ingresar coordenadas manualmente */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  placeholder="Ej: 4.6097"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  placeholder="Ej: -74.0817"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-500"
                />
              </div>

              {/* Vista previa de Google Maps */}
              {latitude && longitude && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Vista previa:</p>
                  <div className="bg-gray-200 rounded-xl overflow-hidden">
                    <iframe
                      title="Mapa de ubicación"
                      width="100%"
                      height="200"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude},${latitude},${longitude},${latitude}&layer=mapnik&marker=${latitude},${longitude}`}
                      className="w-full"
                    ></iframe>
                  </div>
                  <p className="text-xs text-gray-700 mt-2">
                    📍 Lat: {latitude}, Lng: {longitude}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 bg-[#0288D1] hover:bg-[#0277BD] text-white font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLatitude("")
                    setLongitude("")
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-2xl transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Ayuda */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-xs text-blue-900">
                💡 <strong>Tip:</strong> Puedes obtener las coordenadas de cualquier lugar abriendo Google Maps, 
                haciendo clic derecho en el lugar y seleccionando las coordenadas que aparecen.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
