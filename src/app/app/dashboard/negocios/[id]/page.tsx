// src/app/dashboard/negocios/[id]/page.tsx
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import type { Review, ReviewStats as ReviewStatsType, ReviewFormData } from "@/types/review"
import Image from "next/image"
import StarRating from "@/components/reviews/StarRating"
import ReviewStats from "@/components/reviews/ReviewStats"
import ReviewList from "@/components/reviews/ReviewList"
import ReviewForm from "@/components/reviews/ReviewForm"
import BusinessLocation from "@/components/BusinessLocation"
import { trackBusinessView, trackBusinessInteraction } from "@/lib/analytics"
import SendMessageModal from "@/components/messages/SendMessageModal"
import ReportBusinessModal from "@/components/reports/ReportBusinessModal"

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const businessId = params?.id as string

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStatsType | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showReportBusinessModal, setShowReportBusinessModal] = useState(false)

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

  // Parsear y formatear horarios
  const getFormattedSchedule = () => {
    if (!business?.hours) return null

    try {
      const schedules = JSON.parse(business.hours)
      if (!Array.isArray(schedules)) return null
      return schedules
    } catch {
      return null
    }
  }

  const formattedSchedule = getFormattedSchedule()

  // Registrar vista del negocio
  const registerView = useCallback(async () => {
    if (!businessId) return
    
    // Registrar la vista con nuestra función de analytics
    await trackBusinessView(businessId, user?.id)
  }, [businessId, user])

  // Cargar reviews del negocio
  const loadReviews = useCallback(async () => {
    if (!businessId) return

    setReviewsLoading(true)
    try {
      // Cargar todas las reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .rpc('get_business_reviews', { p_business_id: businessId })

      if (reviewsError) {
        console.warn("RPC function not available, using fallback query:", reviewsError)
        // Si la función no existe, usar query normal
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.warn("Reviews table might not exist:", fallbackError)
          setReviews([])
        } else if (fallbackData && fallbackData.length > 0) {
          // Enriquecer con información del usuario actual si es su review
          const reviewsWithUserInfo = fallbackData.map(review => {
            // Si es la review del usuario actual, usar su info
            if (user && review.user_id === user.id) {
              return {
                ...review,
                user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                user_email: user.email
              }
            }
            // Para otros usuarios, mostrar "Usuario" por defecto
            // (idealmente la función RPC debería funcionar)
            return {
              ...review,
              user_name: 'Usuario',
              user_email: null
            }
          })
          
          setReviews(reviewsWithUserInfo)
        } else {
          setReviews([])
        }
      } else if (reviewsData) {
        setReviews(reviewsData)
      }

      // Cargar estadísticas de reviews
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('business_review_stats')
          .select('*')
          .eq('business_id', businessId)
          .single()

        if (!statsError && statsData) {
          setReviewStats(statsData)
        }
      } catch (statsErr) {
        console.warn("Review stats not available:", statsErr)
        // Ignorar si las stats no están disponibles
      }

      // Cargar review del usuario actual si existe
      if (user) {
        try {
          const { data: userReviewData, error: userReviewError } = await supabase
            .from('reviews')
            .select('*')
            .eq('business_id', businessId)
            .eq('user_id', user.id)
            .single()

          if (!userReviewError && userReviewData) {
            setUserReview(userReviewData)
          }
        } catch (userErr) {
          console.warn("User review check failed:", userErr)
          // Ignorar si no se puede verificar la review del usuario
        }
      }
    } catch (error) {
      console.error("Error loading reviews:", error)
      // No detener la carga de la página por errores en reviews
    } finally {
      setReviewsLoading(false)
    }
  }, [businessId, user])

  // Enviar o actualizar review
  const handleSubmitReview = async (data: ReviewFormData) => {
    if (!user || !businessId) {
      alert('Debes iniciar sesión para dejar una reseña')
      return
    }

    try {
      if (userReview) {
        // Actualizar review existente
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: data.rating,
            comment: data.comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id)

        if (error) {
          console.error('Error updating review:', error)
          throw new Error(`Error al actualizar la reseña: ${error.message}`)
        }
      } else {
        // Crear nueva review
        const { data: insertedData, error } = await supabase
          .from('reviews')
          .insert({
            business_id: businessId,
            user_id: user.id,
            rating: data.rating,
            comment: data.comment
          })
          .select()

        if (error) {
          console.error('Error creating review:', error)
          // Mensaje de error específico si la tabla no existe
          if (error.code === '42P01') {
            throw new Error('⚠️ El sistema de reviews no está configurado. Por favor, ejecuta el script SQL en Supabase Dashboard.')
          }
          throw new Error(`Error al crear la reseña: ${error.message}`)
        }
        
        console.log('Review created successfully:', insertedData)
      }

      // Recargar reviews
      await loadReviews()
      setShowReviewForm(false)
      
      // Mensaje de éxito con más detalles
      const successMessage = userReview 
        ? '✅ Tu reseña ha sido actualizada exitosamente' 
        : '🌟 ¡Reseña publicada! Gracias por compartir tu experiencia.'
      
      alert(successMessage)
    } catch (error: any) {
      console.error('Error submitting review:', error)
      throw error
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
  }, [businessId, user, userLoading, router, registerView])

  // Cargar reviews cuando el componente se monta
  useEffect(() => {
    if (businessId && !userLoading) {
      loadReviews()
    }
  }, [businessId, user, userLoading, loadReviews])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Negocio no encontrado</h2>
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
      <header className="bg-gray-900/10 backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/app/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden lg:block"
                title="Volver al Dashboard"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {business.name}
                </h1>
                <p className="text-sm text-gray-300 mt-1">
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
        <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-1 ring-gray-700 shadow-lg">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#0288D1] font-bold text-3xl">
                  {business.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{business.name}</h2>
              {business.description && (
                <p className="text-gray-300 mb-3">{business.description}</p>
              )}
              {business.category && (
                <p className="text-gray-300 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {business.category}
                </p>
              )}
              
              {/* Ubicación con lógica inteligente */}
              {(business.address || (business.latitude && business.longitude)) && (
                <div className="mb-2">
                  <BusinessLocation
                    address={business.address}
                    latitude={business.latitude}
                    longitude={business.longitude}
                    showIcon={true}
                    variant="detailed"
                    className="text-gray-300"
                  />
                </div>
              )}
              
              {(business.phone || business.whatsapp) && (
                <p className="text-gray-300 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {business.phone || business.whatsapp}
                </p>
              )}
            </div>

            {/* Botones de Contacto */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold flex-1"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Contactar por WhatsApp
                </a>
              )}
              
              <button
                onClick={() => setShowMessageModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Enviar Mensaje
              </button>

              {/* Botón Reportar (solo para usuarios no dueños) */}
              {user && !isOwner && (
                <button
                  onClick={() => setShowReportBusinessModal(true)}
                  className="flex items-center justify-center gap-2 bg-transparent border-2 border-red-500/50 text-red-400 px-6 py-3 rounded-full hover:bg-red-500/10 transition-all font-semibold flex-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Reportar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Secciones Públicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Galería de Fotos */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20 p-6 hover:border-white/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Galería de Fotos</h3>
                <p className="text-sm text-gray-300">
                  {galleryUrls.length} fotos
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              {canManage 
                ? "Gestiona las imágenes de tu negocio. Puedes agregar, eliminar o reordenar fotos."
                : "Explora las imágenes del negocio y conoce más sobre sus productos y servicios."
              }
            </p>

            {/* Preview de imágenes */}
            {galleryUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {galleryUrls.slice(0, 3).map((url: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="relative aspect-square overflow-hidden rounded-xl cursor-pointer group" 
                    onClick={() => {
                      setCurrentImageIndex(idx)
                      setShowGallery(true)
                    }}
                  >
                    <Image
                      src={url}
                      alt={`${business.name} - imagen ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {galleryUrls.length > 3 && idx === 2 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                        +{galleryUrls.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canManage ? (
              <Link
                href={`/app/dashboard/negocios/${business.id}/galeria`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
              >
                Gestionar Galería
              </Link>
            ) : (
              <button
                onClick={() => {
                  setCurrentImageIndex(0)
                  setShowGallery(true)
                }}
                className="w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 border border-gray-600/30"
                disabled={galleryUrls.length === 0}
              >
                {galleryUrls.length > 0 ? 'Ver Galería Completa' : 'Sin imágenes'}
              </button>
            )}
          </div>

          {/* Horarios */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20 p-6 hover:border-white/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Horarios</h3>
                <p className="text-sm text-gray-300">Disponibilidad</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              {canManage 
                ? "Configura los días y horarios de atención de tu negocio."
                : "Consulta los horarios de atención del negocio."
              }
            </p>

            {/* Mostrar horarios si existen */}
            {formattedSchedule && formattedSchedule.length > 0 ? (
              <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl p-4 mb-4 space-y-2 border border-orange-500/20">
                {formattedSchedule.map((schedule: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-orange-500/20 last:border-0">
                    <span className={`font-semibold text-sm ${schedule.isOpen ? 'text-white' : 'text-gray-400'}`}>
                      {schedule.day}
                    </span>
                    {schedule.isOpen ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-orange-300">{schedule.openTime}</span>
                        <span className="text-gray-400">—</span>
                        <span className="font-medium text-orange-300">{schedule.closeTime}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm italic">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic mb-4 bg-gray-700/30 rounded-xl p-3 text-center border border-gray-600/20">
                No se han configurado horarios aún
              </p>
            )}

            {canManage && (
              <Link
                href={`/app/dashboard/negocios/${business.id}/horarios`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30"
              >
                {formattedSchedule ? 'Actualizar Horarios' : 'Configurar Horarios'}
              </Link>
            )}
          </div>

          {/* Promociones */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20 p-6 hover:border-white/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Promociones</h3>
                <p className="text-sm text-gray-300">{promotions.length} activa{promotions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {/* Mostrar promociones activas */}
            {promotions.length > 0 && (
              <div className="space-y-3 mb-4">
                {promotions.slice(0, 2).map((promo) => (
                  <div key={promo.id} className="bg-pink-500/10 backdrop-blur-sm rounded-2xl p-4 border border-pink-500/20">
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
                        <h4 className="font-bold text-white text-sm mb-1 truncate">{promo.name}</h4>
                        {promo.price && (
                          <p className="text-lg font-bold text-pink-300">${promo.price.toFixed(2)}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
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

            <p className="text-gray-300 text-sm mb-4">
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
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30"
              >
                Gestionar Promociones
              </Link>
            ) : (
              <Link
                href={`/app/dashboard/negocios/${business.id}/promociones/ver`}
                className="block w-full px-4 py-2 rounded-xl transition-colors font-semibold text-sm text-center bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30"
              >
                Ver Todas las Promociones
              </Link>
            )}
          </div>

        </div>

        {/* Sección de Reviews y Reseñas */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Reseñas y Calificaciones
              </h2>
              <p className="text-gray-300">
                Descubre qué opinan los clientes sobre este negocio
              </p>
            </div>
            
            {/* Botón para dejar reseña: Solo si NO tiene review previa */}
            {user && !isOwner && !userReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Dejar una reseña
              </button>
            )}
            
            {/* Botón para editar reseña: SOLO para administradores */}
            {user && !isOwner && userReview && isAdmin && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
                title="Solo administradores pueden editar reseñas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar reseña (Admin)
              </button>
            )}
            
            {/* Mensaje para usuarios que ya dejaron reseña (no admin) */}
            {user && !isOwner && userReview && !isAdmin && (
              <div className="flex items-center gap-2 text-gray-100 bg-gray-70 px-4 py-2 rounded-full border border-gray-200">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Ya dejaste tu reseña</span>
              </div>
            )}
          </div>

          {/* Formulario de Review (si está visible) */}
          {/* Usuarios regulares: solo pueden crear nueva review */}
          {/* Administradores: pueden editar cualquier review */}
          {showReviewForm && user && !isOwner && (
            (!userReview || (userReview && isAdmin)) ? (
              <div className="mb-8">
                <ReviewForm
                  businessId={businessId}
                  businessName={business.name}
                  existingReview={userReview ? {
                    rating: userReview.rating,
                    comment: userReview.comment
                  } : undefined}
                  onSubmit={handleSubmitReview}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            ) : null
          )}

          {/* Estadísticas de Reviews */}
          {reviewStats && reviewStats.total_reviews > 0 && (
            <div className="mb-8">
              <ReviewStats stats={reviewStats} />
            </div>
          )}

          {/* Lista de Reviews */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Lo que dicen nuestros clientes
            </h3>
            <ReviewList reviews={reviews} loading={reviewsLoading} />
          </div>

          {/* Mensaje si el usuario no está logueado */}
          {!user && (
            <div className="mt-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">
                    ¿Compraste en este negocio?
                  </h4>
                  <p className="text-gray-300 mb-3">
                    Inicia sesión para dejar tu reseña y ayudar a otros clientes
                  </p>
                  <Link
                    href="/app/auth/login"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all font-semibold text-sm"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Galería - Lightbox Mejorado */}
      {showGallery && galleryUrls.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGallery(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowGallery(false)
            if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => prev > 0 ? prev - 1 : galleryUrls.length - 1)
            if (e.key === 'ArrowRight') setCurrentImageIndex(prev => prev < galleryUrls.length - 1 ? prev + 1 : 0)
          }}
          tabIndex={0}
        >
          {/* Botón Cerrar - Esquina superior derecha */}
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm group"
            aria-label="Cerrar galería"
          >
            <svg className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Contador de imágenes - Esquina superior izquierda */}
          <div className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white font-semibold text-sm">
            {currentImageIndex + 1} / {galleryUrls.length}
          </div>

          {/* Botón Anterior */}
          {galleryUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(prev => prev > 0 ? prev - 1 : galleryUrls.length - 1)
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm group"
              aria-label="Imagen anterior"
            >
              <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Botón Siguiente */}
          {galleryUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(prev => prev < galleryUrls.length - 1 ? prev + 1 : 0)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm group"
              aria-label="Imagen siguiente"
            >
              <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Imagen Principal */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <Image
                src={galleryUrls[currentImageIndex]}
                alt={`${business.name} - imagen ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Miniaturas - Parte inferior */}
          {galleryUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-full overflow-x-auto">
              <div className="flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                {galleryUrls.map((url: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(idx)
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      idx === currentImageIndex 
                        ? 'ring-4 ring-white scale-110' 
                        : 'opacity-50 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Miniatura ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nombre del negocio - Parte superior */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-black/50 backdrop-blur-sm rounded-full">
            <h3 className="text-white text-lg font-bold text-center">
              {business.name}
            </h3>
          </div>
        </div>
      )}

      {/* Modal de Mensajes */}
      {showMessageModal && business && user && (
        <SendMessageModal
          business={business}
          currentUserId={user.id}
          onClose={() => setShowMessageModal(false)}
          onSuccess={(businessId) => {
            // Redirigir al chat con el negocio
            router.push(`/app/dashboard/mis-mensajes?business=${businessId}`)
          }}
        />
      )}

      {/* Modal de Reportar Negocio */}
      {showReportBusinessModal && business && (
        <ReportBusinessModal
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowReportBusinessModal(false)}
        />
      )}
    </div>
  )
}

