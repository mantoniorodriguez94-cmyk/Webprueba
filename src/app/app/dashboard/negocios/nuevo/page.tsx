"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LocationSelector from "@/components/LocationSelector"
import { toast } from "sonner"
import { alertModal } from "@/lib/alertModal"
import {
  isTierActive,
  MAX_NEGOCIOS_POR_CUENTA
} from "@/lib/memberships/tiers"

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
  
  // Verificar límite de negocios al cargar la página.
  //
  // Los rebotes de acá van con replace y no con push, a propósito. Esta
  // pantalla es una guardia: si te echa, no tiene por qué quedarse en el
  // historial. Con push quedaba, y volver atrás la montaba de nuevo, que
  // revisaba de nuevo y volvía a echarte — un bucle del que no se sale.
  // Se llega desde el hero de la portada, que manda acá a quien ya tiene
  // sesión, así que el "atrás" que la gente espera es la portada.
  useEffect(() => {
    const checkBusinessLimit = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.replace("/app/auth/login")
          return
        }

        // Verificar si el usuario es tipo company
        const userRole = user.user_metadata?.role ?? "person"
        if (userRole !== "company") {
          alertModal.warning("Para crear negocios, necesitas una cuenta tipo Empresa.")
          router.replace("/app/dashboard")
          return
        }

        // Fuente única de verdad para el tier: profiles.subscription_tier
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date")
          .eq("id", user.id)
          .maybeSingle()

        const rawTier = profile?.subscription_tier ?? 0
        const tierEndDate = profile?.subscription_end_date ?? null
        const effectiveTier = isTierActive(rawTier, tierEndDate) ? rawTier : 0

        setIsPremium(effectiveTier > 0)

        const { count, error: fetchError } = await supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id)

        if (fetchError) throw fetchError

        if ((count ?? 0) >= MAX_NEGOCIOS_POR_CUENTA) {
          alertModal.warning("Ya tienes un negocio registrado. Cada cuenta permite gestionar un solo negocio.")
          router.replace("/app/dashboard/mis-negocios")
          return
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

      // Aviso temprano para no hacerle llenar el formulario a alguien que ya
      // llegó al límite. El candado de verdad es el índice único en la base.
      const { count: currentCount, error: countError } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)

      if (countError) throw countError

      if ((currentCount ?? 0) >= MAX_NEGOCIOS_POR_CUENTA) {
        setError("⚠️ Cada cuenta puede tener un solo negocio.")
        setLoading(false)
        return
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-ink-2">Verificando permisos...</p>
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
            className="text-sm text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-2 group mb-4"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-3xl font-bold text-ink">Crear nuevo negocio</h1>
          <p className="text-ink-2 mt-1">Completa la información de tu negocio</p>
        </div>

        {/* Form Card */}
        <div className="surface rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-ink mb-2">
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
              <label htmlFor="description" className="block text-sm font-semibold text-ink mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                rows={4}
                  className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500 resize-none sm:pb-3"
                disabled={loading}
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-ink mb-2">
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
            <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-bold text-ink">Ubicación del Negocio *</h3>
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
                <label htmlFor="addressDetails" className="block text-sm font-semibold text-ink mb-2">
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
                <p className="text-xs text-ink-2 mt-1">
                  Información adicional para ayudar a los clientes a encontrarte
                </p>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-ink mb-2">
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
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-ink mb-2">
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
              <label htmlFor="logo" className="block text-sm font-semibold text-ink mb-2">
                Logo (opcional)
              </label>
              <div className="relative">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={e => setLogo(e.target.files?.[0] ?? null)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20"
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
              <label htmlFor="gallery" className="block text-sm font-semibold text-ink mb-2 flex items-center justify-between">
                <span>Galería de imágenes (opcional)</span>
                <span className={`text-xs font-normal ${isPremium ? 'text-amber-600' : 'text-ink-2'}`}>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20"
                  disabled={loading}
                />
              </div>
              
              {/* Mensaje de error si excede el límite */}
              {galleryError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">{galleryError}</p>
                </div>
              )}
              
              {/* Contador de archivos seleccionados */}
              {gallery && gallery.length > 0 && (
                <p className={`text-xs mt-2 ${gallery.length === maxImages ? 'text-amber-600 font-semibold' : 'text-ink-2'}`}>
                  ✓ {gallery.length} de {maxImages} imagen{gallery.length !== 1 ? 'es' : ''} seleccionada{gallery.length !== 1 ? 's' : ''}
                  {!isPremium && (
                    <Link href="/app/dashboard/perfil" className="ml-2 text-amber-600 hover:text-amber-700 underline">
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
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                className="flex-1 text-center border-2 border-black/15 text-ink-2 hover:text-ink font-semibold py-3 px-6 rounded-2xl hover:bg-black/5 hover:border-black/25 transition-colors"
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
