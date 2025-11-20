// src/components/feed/BusinessFeedCard.tsx
"use client"
import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Business } from "@/types/business"
import type { User } from "@supabase/supabase-js"
import SendMessageModal from "@/components/messages/SendMessageModal"

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
  const [imageError, setImageError] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const gallery = business.gallery_urls ?? [];
  
  // Verificar si el usuario actual es el dueño o es admin
  const isOwner = currentUser?.id === business.owner_id
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  
  // Debug: Log de permisos (temporal para debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('BusinessFeedCard Debug:', {
      businessName: business.name,
      businessOwnerId: business.owner_id,
      currentUserId: currentUser?.id,
      isOwner,
      isAdmin,
      canEdit,
      canDelete
    })
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white/40 hover:shadow-2xl hover:bg-white/95 transition-all duration-500 overflow-hidden group">
      {/* Header del negocio */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Logo del negocio - Clickeable */}
          <Link href={`/app/dashboard/negocios/${business.id}`} className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-2 ring-white shadow-md hover:ring-4 hover:ring-[#0288D1]/30 transition-all cursor-pointer">
            {business.logo_url && !imageError ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </Link>
          
          {/* Info del negocio - Clickeable */}
          <div className="flex-1 min-w-0">
            <Link href={`/app/dashboard/negocios/${business.id}`}>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate hover:text-[#0288D1] transition-colors cursor-pointer">
                {business.name}
              </h3>
            </Link>
            {business.category && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {business.category}
              </p>
            )}
          </div>

          {/* Badge "Nuevo" si fue creado recientemente */}
          {business.created_at && isRecent(business.created_at) && (
            <span className="px-3 py-1 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white text-xs font-semibold rounded-full shadow-lg">
              Nuevo
            </span>
          )}

          {/* Botones de Admin/Dueño */}
          {canEdit && (
            <div className="flex items-center gap-2">
              {isAdmin && !isOwner && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  Admin
                </span>
              )}
              <Link
                href={`/app/dashboard/negocios/${business.id}/editar`}
                className="p-2 text-gray-600 hover:text-[#0288D1] hover:bg-[#E3F2FD] rounded-full transition-all"
                title="Editar negocio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar "${business.name}"?`)) {
                      onDelete(business.id)
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Eliminar negocio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      {business.description && (
        <div className="px-4 sm:px-6 py-4">
          <p className={`text-gray-700 leading-relaxed ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {business.description}
          </p>
          {business.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[#0288D1] hover:text-[#0277BD] text-sm font-semibold mt-2 transition-colors"
            >
              {showFullDescription ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      )}

      {/* Galería de imágenes */}
      {business.gallery_urls && business.gallery_urls.length > 0 && (
        <div className="relative">
          <div className="grid grid-cols-3 gap-1 p-1">
          {Array.isArray(business.gallery_urls) &&
            business.gallery_urls.slice(0, 3).map((url: string, idx: number) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-xl cursor-pointer group/img"
                onClick={() => setShowGallery(true)}
              >
                <Image
                  src={url}
                  alt={`${business.name} - imagen ${idx + 1}`}
                  fill
                  className="object-cover group-hover/img:scale-110 transition-transform duration-300"
                />
                {idx === 2 && gallery.length > 3 && (
  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
    <span className="text-white text-2xl font-bold">
      +{gallery.length - 3}
    </span>
  </div>
)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de contacto y ubicación */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 space-y-2">
        {business.address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-[#0288D1] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1">{business.address}</span>
          </div>
        )}

        {(business.phone || business.whatsapp) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-[#0288D1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{business.phone || business.whatsapp}</span>
          </div>
        )}
      </div>

      {/* Barra de interacción */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                liked
                  ? "bg-red-50 text-red-500"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <svg
                className={`w-5 h-5 transition-all ${liked ? "fill-red-500 scale-110" : ""}`}
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
              <span className="text-sm font-semibold">Me gusta</span>
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                saved
                  ? "bg-[#E3F2FD] text-[#0288D1]"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <svg
                className={`w-5 h-5 transition-all ${saved ? "fill-[#0288D1] scale-110" : ""}`}
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
              <span className="text-sm font-semibold">Guardar</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Botón Enviar Mensaje - Solo si el usuario está logueado y NO es el dueño */}
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowMessageModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#E3F2FD] text-[#0288D1] transition-all duration-300 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm hidden sm:inline">Mensaje</span>
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-50 text-gray-600 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-semibold">Compartir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Botones de acción principales */}
      <div className="p-4 sm:p-6 pt-3 flex gap-3">
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
            className="flex-1 bg-gradient-to-r from-[#0288D1] to-[#0277BD] hover:shadow-xl text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Llamar
          </a>
        )}
        <Link 
          href={`/app/dashboard/negocios/${business.id}`}
          className="flex-1 border-2 border-[#0288D1] text-[#0288D1] hover:bg-[#0288D1] hover:text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
          onSuccess={() => {
            // Aquí puedes agregar lógica adicional después de enviar el mensaje
            console.log("Mensaje enviado exitosamente")
          }}
        />
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

