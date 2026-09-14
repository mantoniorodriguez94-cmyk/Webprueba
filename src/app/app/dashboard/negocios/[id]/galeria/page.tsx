// src/app/dashboard/negocios/[id]/galeria/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import { getMaxPhotosForTier } from "@/lib/memberships/tiers"
import { topeDeFotos } from "@/lib/memberships/perks"
import { comprimirImagen } from "@/lib/comprimirImagen"
import { confirmModal } from "@/lib/confirmModal"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import Image from "next/image"
import { alertModal } from "@/lib/alertModal"

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyBmaWxsPSIjMTMxMzEzIiB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="

export default function GaleriaPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const businessId = params?.id as string

  // Verificar permisos
  const isOwner = user?.id === business?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canManage = isOwner || isAdmin
  
  // Verificar si el negocio es premium activo
  // El nivel del plan del dueño, que es quien está editando su propia galería.
  // Antes esta pantalla solo veía un is_premium genérico, y por eso no podía
  // distinguir entre Conecta, Destaca y Patrocina.
  const { effectiveTier } = useMembershipAccess()

  const isPremiumActive = business?.is_premium === true && 
                         business?.premium_until && 
                         new Date(business.premium_until) > new Date()
  
  /* El límite sale del plan y de nada más, definido en lib/memberships/tiers
     para que la tabla de precios y el producto no puedan volver a divergir.
     Antes esta línea era `business?.max_photos ?? getMaxPhotosForTier(...)`, y
     como `max_photos` trae 5 en todas las filas —no null— ese 5 ganaba
     siempre: la escalera por plan nunca llegó a aplicarse y los cuatro planes
     daban lo mismo. Se usa effectiveTier y no `tier` porque el hook ya colapsa
     a 0 las suscripciones vencidas; `is_premium` es un espejo a nivel negocio
     que puede quedar desactualizado respecto al perfil. */
  const maxImages = business ? topeDeFotos(business, effectiveTier) : getMaxPhotosForTier(effectiveTier)

  // Parsear gallery_urls de manera segura
  const getGalleryUrls = (): string[] => {
    if (!business?.gallery_urls) return []
    
    if (Array.isArray(business.gallery_urls)) {
      return business.gallery_urls
    }
    
    if (typeof business.gallery_urls === 'string') {
      try {
        const parsed = JSON.parse(business.gallery_urls)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    
    return []
  }

  const galleryUrls = getGalleryUrls()

  // Cargar datos del negocio
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId || !user) return

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (error) throw error

        // Verificar permisos
        const hasPermission = data.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          alertModal.warning("No tienes permiso para gestionar la galería de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(data)
      } catch (error) {
        console.error("Error cargando negocio:", error)
        alertModal.error("Error cargando el negocio")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId, user, router])

  // Subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !business) return

    // Validar límite de imágenes según plan
    const currentImageCount = galleryUrls.length
    if (currentImageCount >= maxImages) {
      // El mensaje nombra el límite real del plan que tiene la persona, y el
      // del siguiente nivel solo si existe uno mejor.
      const siguienteNivel = getMaxPhotosForTier(effectiveTier + 1)
      alertModal.warning(`Llegaste al límite de ${maxImages} fotos de tu plan`, {
        description:
          siguienteNivel > maxImages
            ? `Con el siguiente plan puedes subir hasta ${siguienteNivel}. También puedes eliminar algunas fotos para hacer lugar.`
            : "Elimina algunas fotos antes de agregar nuevas.",
      })
      e.target.value = "" // Limpiar input
      return
    }

    // Tope generoso: el archivo se comprime antes de subir, así que esto
    // solo frena cosas absurdas (un RAW de cámara, un archivo corrupto).
    if (file.size > 25 * 1024 * 1024) {
      alertModal.warning("La imagen no debe superar los 5MB")
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alertModal.warning("Solo se permiten archivos de imagen")
      return
    }

    setUploading(true)

    try {
      // Se comprime ANTES de subir: una foto de teléfono son 3-5 MB y acá se
      // guardaba entera para mostrarse en una tarjeta de 400px. El costo real
      // no es el almacenamiento sino la transferencia de servirla después.
      const { archivo, bytesOriginales, bytesFinales } = await comprimirImagen(file)
      if (bytesFinales < bytesOriginales) {
        console.info(
          `[galeria] ${(bytesOriginales / 1024 / 1024).toFixed(1)} MB → ${(bytesFinales / 1024).toFixed(0)} KB`
        )
      }

      const fileExt = archivo.name.split('.').pop()
      const fileName = `${businessId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-gallery')
        .upload(fileName, archivo)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('business-gallery')
        .getPublicUrl(fileName)

      // Actualizar array de URLs
      const currentUrls = getGalleryUrls()
      const newUrls = [...currentUrls, publicUrl]

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ gallery_urls: newUrls })
        .eq("id", businessId)

      if (updateError) throw updateError

      // Actualizar estado local
      setBusiness({ ...business, gallery_urls: newUrls as any })
      alertModal.success("Imagen agregada exitosamente")
    } catch (error: any) {
      console.error("Error subiendo imagen:", error)
      alertModal.error("Error al subir la imagen", {
        description: error.message || "Error desconocido"
      })
    } finally {
      setUploading(false)
    }
  }

  // Eliminar imagen
  const handleDeleteImage = async (imageUrl: string) => {
    if (!business) return
    const confirmado = await confirmModal("¿Eliminar esta imagen?", {
      description: "Se quitará de la galería de tu negocio y no se puede recuperar.",
      confirmLabel: "Eliminar",
    })
    if (!confirmado) return

    try {
      // Extraer el path del storage desde la URL
      const urlParts = imageUrl.split('/business-gallery/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        // Eliminar del storage
        const { error: deleteError } = await supabase.storage
          .from('business-gallery')
          .remove([filePath])

        if (deleteError) {
          console.warn("Error eliminando del storage:", deleteError)
        }
      }

      // Actualizar array de URLs
      const currentUrls = getGalleryUrls()
      const newUrls = currentUrls.filter(url => url !== imageUrl)

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ gallery_urls: newUrls })
        .eq("id", businessId)

      if (updateError) throw updateError

      // Actualizar estado local
      setBusiness({ ...business, gallery_urls: newUrls as any })
      alertModal.success("Imagen eliminada exitosamente")
    } catch (error: any) {
      console.error("Error eliminando imagen:", error)
      alertModal.error("Error al eliminar la imagen", {
        description: error.message || "Error desconocido"
      })
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface-elevated rounded-3xl p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-ink-2 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business || !canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface-elevated rounded-3xl p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-ink mb-4">Acceso denegado</h2>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all"
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
      <SectionHeader
        titulo="Galería"
        subtitulo={business?.name}
        ancho="7xl"
        onVolver={() => router.back()}
        icono={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Botón para agregar imagen */}
        <div className={`surface rounded-3xl shadow-sm p-6 mb-8 ${
          isPremiumActive ? 'border-amber-300' : ''
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-ink">Agregar Nueva Imagen</h2>
                {isPremiumActive && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">⭐ Premium</span>
                )}
              </div>
              <p className="text-sm text-ink-2 mb-2">Tamaño máximo: 5MB • Formatos: JPG, PNG, GIF, WebP</p>
              
              {/* Contador de imágenes */}
              <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full ${
                galleryUrls.length >= maxImages 
                  ? 'bg-red-50 text-red-700' 
                  : isPremiumActive 
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {galleryUrls.length} / {maxImages} imágenes
                {galleryUrls.length >= maxImages && " (límite alcanzado)"}
              </div>
              
              {/* Invitación a subir de plan: nombra el tope del SIGUIENTE
                  nivel, no un "premium" genérico, y desaparece cuando ya se
                  está en el más alto. Enlaza a los planes, no al perfil. */}
              {galleryUrls.length > 0 &&
                getMaxPhotosForTier(effectiveTier + 1) > maxImages && (
                  <div className="mt-2 text-xs text-ink-2">
                    <Link
                      href="/app/dashboard/membresia"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Sube de plan
                    </Link>{" "}
                    para subir hasta {getMaxPhotosForTier(effectiveTier + 1)} fotos
                  </div>
                )}
            </div>
            <label className={`relative ${galleryUrls.length >= maxImages ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || galleryUrls.length >= maxImages}
                className="hidden"
              />
              <div className={`flex items-center gap-2 text-white px-6 py-3 rounded-full transition-all font-semibold ${
                uploading || galleryUrls.length >= maxImages
                  ? 'bg-black/20 opacity-50 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
              }`}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Subiendo...
                  </>
                ) : galleryUrls.length >= maxImages ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Límite Alcanzado
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Imagen
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Galería de Imágenes */}
        {galleryUrls.length === 0 ? (
          <div className="surface rounded-3xl shadow-sm p-12 text-center">
            <svg className="w-24 h-24 text-black/15 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-ink mb-2">No hay imágenes en la galería</h3>
            <p className="text-ink-2 mb-6">Comienza agregando fotos de tu negocio para atraer más clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryUrls.map((url: string, idx: number) => (
              <div key={idx} className="surface rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedImage(url)}>
                  <Image
                    src={url}
                    alt={`Imagen ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <button
                    onClick={() => handleDeleteImage(url)}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Imagen Ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-5xl w-full relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="Imagen ampliada"
                fill
                className="object-contain"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

