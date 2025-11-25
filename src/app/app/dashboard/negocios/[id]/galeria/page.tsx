// src/app/dashboard/negocios/[id]/galeria/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import Image from "next/image"

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
          alert("No tienes permiso para gestionar la galería de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(data)
      } catch (error) {
        console.error("Error cargando negocio:", error)
        alert("Error cargando el negocio")
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

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB")
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert("Solo se permiten archivos de imagen")
      return
    }

    setUploading(true)

    try {
      // Subir a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${businessId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-gallery')
        .upload(fileName, file)

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
      alert("✅ Imagen agregada exitosamente")
    } catch (error: any) {
      console.error("Error subiendo imagen:", error)
      alert("❌ Error al subir la imagen: " + (error.message || "Error desconocido"))
    } finally {
      setUploading(false)
    }
  }

  // Eliminar imagen
  const handleDeleteImage = async (imageUrl: string) => {
    if (!business) return
    if (!confirm("¿Estás seguro de eliminar esta imagen?")) return

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
      alert("✅ Imagen eliminada exitosamente")
    } catch (error: any) {
      console.error("Error eliminando imagen:", error)
      alert("❌ Error al eliminar la imagen: " + (error.message || "Error desconocido"))
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-700/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business || !canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-700/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso denegado</h2>
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
      <header className="bg-gray-800/95 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/app/dashboard/negocios/${business.id}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gestionar Galería
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  {business.name} • {galleryUrls.length} foto{galleryUrls.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Botón para agregar imagen */}
        <div className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-700/40 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Agregar Nueva Imagen</h2>
              <p className="text-sm text-gray-300">Tamaño máximo: 5MB • Formatos: JPG, PNG, GIF, WebP</p>
            </div>
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className={`flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Subiendo...
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
          <div className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-700/40 p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">No hay imágenes en la galería</h3>
            <p className="text-gray-300 mb-6">Comienza agregando fotos de tu negocio para atraer más clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryUrls.map((url: string, idx: number) => (
              <div key={idx} className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-700/40 overflow-hidden hover:shadow-2xl transition-all group">
                <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedImage(url)}>
                  <Image
                    src={url}
                    alt={`Imagen ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
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
              className="absolute -top-12 right-0 p-2 hover:bg-white/20 rounded-full transition-colors"
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

