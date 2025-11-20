// src/app/dashboard/negocios/[id]/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import Image from "next/image"

type Promotion = {
  id: string
  business_id: string
  name: string
  image_url: string | null
  price: number | null
  start_date: string
  end_date: string
  is_active: boolean
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showGallery, setShowGallery] = useState(false)
  const businessId = params?.id as string

  // Verificar permisos
  const isOwner = user?.id === business?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canManage = isOwner || isAdmin

  // Parsear gallery_urls de manera segura
  const getGalleryUrls = (): string[] => {
    if (!business?.gallery_urls) return []
    
    // Si ya es un array, devolverlo
    if (Array.isArray(business.gallery_urls)) {
      return business.gallery_urls
    }
    
    // Si es un string, intentar parsearlo como JSON
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

  // Registrar vista del negocio (si la tabla existe)
  const registerView = async () => {
    if (!businessId || !user) return

    try {
      await supabase
        .from("business_views")
        .insert({
          business_id: businessId,
          viewer_id: user.id
        })
    } catch (error) {
      // Ignorar errores silenciosamente (la tabla puede no existir aún o ya se registró hoy)
      // Esto no debe impedir que la página funcione
    }
  }

  // Cargar datos del negocio
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId || userLoading) return

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (error) throw error
        setBusiness(data)

        // Registrar vista de manera asíncrona (no bloqueante)
        // Solo si hay usuario y no es el dueño
        if (user && user.id !== data.owner_id) {
          // No esperamos la respuesta para no bloquear la carga
          registerView().catch(() => {
            // Ignorar errores de analytics
          })
        }

        // Cargar promociones del negocio
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("*")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .gte("end_date", new Date().toISOString().split('T')[0])
          .lte("start_date", new Date().toISOString().split('T')[0])
          .order("created_at", { ascending: false })

        if (!promotionsError && promotionsData) {
          setPromotions(promotionsData)
        }
      } catch (error) {
        console.error("Error cargando negocio:", error)
        alert("Error cargando el negocio")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId, user, userLoading, router])

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

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Negocio no encontrado</h2>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/app/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver al dashboard"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {business.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {business.category || "Negocio"}
                </p>
              </div>
            </div>

            {/* Botón Gestionar (solo para dueño) */}
            {isOwner && (
              <Link
                href={`/app/dashboard/negocios/${business.id}/gestionar`}
                className="flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-4 py-2 rounded-full hover:shadow-xl transition-all font-semibold text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel de Gestión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del Negocio - Card Principal */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-4 ring-white shadow-lg">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#0288D1] font-bold text-3xl">
                  {business.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h2>
              {business.description && (
                <p className="text-gray-600 mb-3">{business.description}</p>
              )}
              {business.category && (
                <p className="text-gray-600 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {business.category}
                </p>
              )}
              {business.address && (
                <p className="text-gray-600 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.address}
                </p>
              )}
              {(business.phone || business.whatsapp) && (
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {business.phone || business.whatsapp}
                </p>
              )}
            </div>

            {/* Botón de Contacto */}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Grid de Secciones Públicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Galería de Fotos */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Galería de Fotos</h3>
                <p className="text-sm text-gray-600">
                  {galleryUrls.length} fotos
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {canManage 
                ? "Gestiona las imágenes de tu negocio. Puedes agregar, eliminar o reordenar fotos."
                : "Explora las imágenes del negocio y conoce más sobre sus productos y servicios."
              }
            </p>

            {/* Preview de imágenes */}
            {galleryUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {galleryUrls.slice(0, 3).map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-xl cursor-pointer group" onClick={() => setShowGallery(true)}>
                    <Image
                      src={url}
                      alt={`${business.name} - imagen ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {canManage ? (
              <Link
                href={`/app/dashboard/negocios/${business.id}/galeria`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-purple-50 text-purple-700 hover:bg-purple-100"
              >
                Gestionar Galería
              </Link>
            ) : (
              <button
                onClick={() => setShowGallery(true)}
                className="w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                Ver Galería
              </button>
            )}
          </div>

          {/* Horarios */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Horarios</h3>
                <p className="text-sm text-gray-600">Disponibilidad</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {canManage 
                ? "Configura los días y horarios de atención de tu negocio."
                : "Consulta los horarios de atención del negocio."
              }
            </p>

            {/* Mostrar horarios si existen */}
            {business.hours ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <pre className="whitespace-pre-wrap text-gray-700">{business.hours}</pre>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic mb-4">No se han configurado horarios aún</p>
            )}

            {canManage ? (
              <Link
                href={`/app/dashboard/negocios/${business.id}/horarios`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-orange-50 text-orange-700 hover:bg-orange-100"
              >
                Configurar Horarios
              </Link>
            ) : (
              <button
                onClick={() => alert("Funcionalidad de visualización de horarios próximamente disponible")}
                className="w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                Ver Horarios
              </button>
            )}
          </div>

          {/* Promociones */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Promociones</h3>
                <p className="text-sm text-gray-600">{promotions.length} activa{promotions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {/* Mostrar promociones activas */}
            {promotions.length > 0 && (
              <div className="space-y-3 mb-4">
                {promotions.slice(0, 2).map((promo) => (
                  <div key={promo.id} className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-4 border border-pink-200">
                    <div className="flex items-start gap-3">
                      {promo.image_url && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={promo.image_url}
                            alt={promo.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">{promo.name}</h4>
                        {promo.price && (
                          <p className="text-lg font-bold text-pink-600">${promo.price.toFixed(2)}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          Válida hasta {new Date(promo.end_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {promotions.length > 2 && (
                  <p className="text-xs text-center text-gray-500 font-medium">
                    +{promotions.length - 2} promoción{promotions.length - 2 !== 1 ? 'es' : ''} más
                  </p>
                )}
              </div>
            )}

            <p className="text-gray-600 text-sm mb-4">
              {canManage 
                ? "Crea ofertas especiales y promociones para atraer más clientes."
                : promotions.length === 0 
                  ? "Este negocio no tiene promociones activas por el momento."
                  : "Descubre todas las ofertas y promociones especiales disponibles."
              }
            </p>
            
            {canManage ? (
              <Link
                href={`/app/dashboard/negocios/${business.id}/promociones`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-pink-50 text-pink-700 hover:bg-pink-100"
              >
                Gestionar Promociones
              </Link>
            ) : promotions.length > 0 ? (
              <button
                onClick={() => alert("Ver promociones completas - Próximamente")}
                className="w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm bg-pink-50 text-pink-700 hover:bg-pink-100"
              >
                Ver Todas las Promociones
              </button>
            ) : null}
          </div>

        </div>
      </div>

      {/* Modal de Galería */}
      {showGallery && galleryUrls.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div className="max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-2xl font-bold">Galería de {business.name}</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryUrls.map((url: string, idx: number) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={url}
                    alt={`${business.name} - imagen ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

