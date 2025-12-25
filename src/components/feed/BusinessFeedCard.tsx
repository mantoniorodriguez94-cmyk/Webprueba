// src/components/feed/BusinessFeedCard.tsx - REDISEÑO MOBILE PREMIUM
"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Business } from "@/types/business"
import type { User } from "@supabase/supabase-js"
import SendMessageModal from "@/components/messages/SendMessageModal"
import StarRating from "@/components/reviews/StarRating"
import BusinessLocation from "@/components/BusinessLocation"
import PremiumBadge, { PremiumBanner } from "@/components/ui/PremiumBadge"
import { 
  trackBusinessInteraction, 
  toggleBusinessSave, 
  checkBusinessSaved 
} from "@/lib/analytics"

interface BusinessFeedCardProps {
  business: Business
  currentUser?: User | null
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export default function BusinessFeedCard({ 
  business, 
  currentUser, 
  isAdmin = false,
  onDelete 
}: BusinessFeedCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  
  // Verificar si el negocio ya está guardado
  useEffect(() => {
    const checkSaved = async () => {
      if (currentUser && business.id) {
        const isSaved = await checkBusinessSaved(business.id, currentUser.id)
        setSaved(isSaved)
      }
    }
    checkSaved()
  }, [currentUser, business.id])
  
  // Parsear gallery_urls correctamente
  const getGalleryUrls = (): string[] => {
    if (!business.gallery_urls) return []
    if (Array.isArray(business.gallery_urls)) return business.gallery_urls
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
  
  const gallery = getGalleryUrls()
  const isOwner = currentUser?.id === business.owner_id
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  
  // Handlers con tracking de analytics
  const handleLike = async () => {
    const newLikedState = !liked
    setLiked(newLikedState)
    
    if (newLikedState && business.id) {
      await trackBusinessInteraction(business.id, 'like', currentUser?.id)
    }
  }
  
  const handleSave = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para guardar negocios")
      return
    }
    
    if (!business.id) return
    
    const newSavedState = await toggleBusinessSave(business.id, currentUser.id)
    setSaved(newSavedState)
  }
  
  const handleShare = async () => {
    if (business.id) {
      await trackBusinessInteraction(business.id, 'share', currentUser?.id)
    }
    
    // Copiar URL pública al portapapeles o compartir nativo (SEO-friendly)
    const url = `${window.location.origin}/negocio/${business.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description || `Mira ${business.name} en Encuentra`,
          url: url
        })
      } catch (err) {
        console.log("Error compartiendo:", err)
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(url)
        alert("Enlace copiado al portapapeles")
      } catch (err) {
        console.error("Error copiando enlace:", err)
      }
    }
  }
  
  const handleWhatsApp = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'whatsapp', currentUser?.id)
    }
  }
  
  const handlePhone = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'phone', currentUser?.id)
    }
  }
  
  const handleMessage = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'message', currentUser?.id)
    }
    setShowMessageModal(true)
  }
  
  const handleGalleryView = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'gallery_view', currentUser?.id)
    }
    setShowGallery(true)
  }

  // Verificar si el negocio es premium activo Y tiene el borde dorado activado
  const isPremiumActive = business.is_premium === true && 
                         business.premium_until && 
                         new Date(business.premium_until) > new Date()
  
  // Verificar si debe mostrar el borde dorado (premium + golden_border_active)
  const showGoldenBorder = isPremiumActive && business.golden_border_active === true

  return (
    <div className={`backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-300 animate-fade-in relative ${
      showGoldenBorder 
        ? 'border-2 border-yellow-500/70 hover:border-yellow-400/90 shadow-xl shadow-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5' 
        : 'border border-white/20 hover:border-white/30 bg-transparent'
    }`}>
      {/* Banner Premium */}
      {isPremiumActive && <PremiumBanner />}
      
      {/* Header del negocio */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Logo del negocio */}
          <Link href={`/app/dashboard/negocios/${business.id}`} className="flex-shrink-0">
            <div className={`relative w-14 h-14 rounded-2xl overflow-hidden ${
              showGoldenBorder 
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/70 shadow-lg shadow-yellow-500/30' 
                : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-gray-600'
            }`}>
              {business.logo_url && !imageError ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
          
          {/* Info del negocio */}
          <div className="flex-1 min-w-0">
            <Link href={`/app/dashboard/negocios/${business.id}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate hover:text-blue-400 transition-colors">
                  {business.name}
                </h3>
                {isPremiumActive && <PremiumBadge variant="small" showText={false} />}
              </div>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {business.category && (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {business.category}
                </span>
              )}
              {business.total_reviews && business.total_reviews > 0 && (
                <>
                  {business.category && <span className="text-gray-600">•</span>}
                  <div className="flex items-center gap-1">
                    <StarRating rating={business.average_rating || 0} size="sm" />
                    <span className="text-sm text-gray-400 font-semibold">
                      {business.average_rating?.toFixed(1)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Badge "Nuevo" */}
          {business.created_at && isRecent(business.created_at) && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
              Nuevo
            </span>
          )}

          {/* Botones de Admin/Dueño */}
          {canEdit && (
            <div className="flex items-center gap-1">
              {isAdmin && !isOwner && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                  Admin
                </span>
              )}
              <Link
                href={`/app/dashboard/negocios/${business.id}/editar`}
                className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-all"
                title="Editar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${business.name}"?`)) {
                      onDelete(business.id)
                    }
                  }}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-all"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Galería de imágenes - Scroll horizontal */}
      {gallery.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {gallery.map((url: string, idx: number) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-32 h-32 overflow-hidden rounded-xl cursor-pointer group snap-start"
                onClick={handleGalleryView}
              >
                <Image
                  src={url}
                  alt={`${business.name} - imagen ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
            {gallery.length > 3 && (
              <div className="flex-shrink-0 w-32 h-32 bg-gray-700/50 rounded-xl flex items-center justify-center">
                <button
                  onClick={handleGalleryView}
                  className="text-white text-center"
                >
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold">Ver todas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Descripción */}
      {business.description && (
        <div className="px-4 py-3">
          <p className={`text-gray-300 leading-relaxed text-sm ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {business.description}
          </p>
          {business.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold mt-2 transition-colors"
            >
              {showFullDescription ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      )}

      {/* Información de contacto */}
      <div className="px-4 py-3 space-y-2 border-t border-gray-700">
        {/* Ubicación con lógica inteligente */}
        {(business.address || (business.latitude && business.longitude)) && (
          <BusinessLocation
            address={business.address}
            latitude={business.latitude}
            longitude={business.longitude}
            showIcon={true}
            variant="default"
          />
        )}

        {(business.phone || business.whatsapp) && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-gray-400">{business.phone || business.whatsapp}</span>
          </div>
        )}
      </div>

      {/* Barra de Acciones */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Me gusta */}
          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-all ${
              liked ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            <svg
              className={`w-6 h-6 transition-all ${liked ? "fill-current scale-110" : ""}`}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Mensaje */}
          {currentUser && !isOwner && (
            <button
              onClick={handleMessage}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-blue-400 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          {/* Compartir */}
          <button onClick={handleShare} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-green-400 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-full transition-all ${
            saved ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:bg-gray-700"
          }`}
        >
          <svg
            className={`w-6 h-6 transition-all ${saved ? "fill-current scale-110" : ""}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      {/* Botones de Acción Principales */}
      <div className="p-4 pt-0 flex gap-2">
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contactar
          </a>
        )}
        {business.phone && !business.whatsapp && (
          <a
            href={`tel:${business.phone}`}
            onClick={handlePhone}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Llamar
          </a>
        )}
        <Link 
          href={`/app/dashboard/negocios/${business.id}`}
          className="flex-1 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 text-white hover:border-gray-500 font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ver más
        </Link>
      </div>

      {/* Modal de enviar mensaje */}
      {showMessageModal && currentUser && (
        <SendMessageModal
          business={business}
          currentUserId={currentUser.id}
          onClose={() => setShowMessageModal(false)}
          onSuccess={(businessId) => {
            // Redirigir al chat con el negocio
            router.push(`/app/dashboard/mis-mensajes?business=${businessId}`)
          }}
        />
      )}

      {/* Modal de galería completa */}
      {showGallery && gallery.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Galería de {business.name}
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid de imágenes */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[80vh] overflow-y-auto">
              {gallery.map((url: string, idx: number) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-gray-800">
                  <Image
                    src={url}
                    alt={`${business.name} - imagen ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    unoptimized
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

// Helper function to check if business is recent (within last 7 days)
function isRecent(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}
