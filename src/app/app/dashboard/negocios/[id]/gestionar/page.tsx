// src/app/dashboard/negocios/[id]/gestionar/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import GoldenBorderToggle from "@/components/business/GoldenBorderToggle"
import NotificationModal from "@/components/ui/NotificationModal"

type Promotion = {
  id: string
  is_active: boolean
  start_date: string
  end_date: string
}

export default function GestionarNegocioPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const businessId = params?.id as string
  
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

  // Contar promociones activas
  const activePromotionsCount = promotions.filter(p => {
    if (!p.is_active) return false
    const today = new Date()
    const start = new Date(p.start_date)
    const end = new Date(p.end_date)
    return start <= today && end >= today
  }).length

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

        // Verificar que el usuario es el dueño
        if (data.owner_id !== user.id) {
          showNotification("error", "No tienes permiso para gestionar este negocio", "Acceso denegado")
          setTimeout(() => router.push("/app/dashboard"), 2000)
          return
        }

        setBusiness(data)

        // Cargar promociones
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("id, is_active, start_date, end_date")
          .eq("business_id", businessId)

        if (!promotionsError && promotionsData) {
          setPromotions(promotionsData)
        }

        // Cargar mensajes no leídos
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("business_id", businessId)

        if (!convError && conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id)
          const { data: unreadMessages, error: msgError } = await supabase
            .from("messages")
            .select("id")
            .in("conversation_id", conversationIds)
            .eq("is_read", false)
            .neq("sender_id", user.id) // No contar mensajes propios

          if (!msgError && unreadMessages) {
            setUnreadMessagesCount(unreadMessages.length)
          }
        }
      } catch (error) {
        console.error("Error cargando negocio:", error)
        showNotification("error", "No se pudo cargar la información del negocio", "Error de carga")
        setTimeout(() => router.push("/app/dashboard"), 2000)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId, user, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
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
      <header className="bg-transparent backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Gestionar Negocio
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  {business.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del Negocio - Card Principal */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0 ring-4 ring-gray-700 shadow-lg">
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
                <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-3xl">
                  {business.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">{business.name}</h2>
                
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {business.is_premium && business.premium_until && new Date(business.premium_until) > new Date() && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-bold rounded-full shadow-lg">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PREMIUM
                    </span>
                  )}
                  
                  {/* Control de Borde Dorado */}
                  <GoldenBorderToggle
                    businessId={business.id}
                    businessName={business.name}
                    isPremium={business.is_premium || false}
                    premiumUntil={business.premium_until || null}
                  />
                </div>
              </div>
              
              {business.category && (
                <p className="text-gray-300 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {business.category}
                </p>
              )}
              {business.address && (
                <p className="text-gray-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.address}
                </p>
              )}
            </div>

            {/* Botón Editar */}
            <Link
              href={`/app/dashboard/negocios/${business.id}/editar`}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Información
            </Link>
          </div>
        </div>

        {/* Grid de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Galería de Fotos */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 hover:shadow-2xl hover:border-gray-600 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Galería de Fotos</h3>
                <p className="text-sm text-gray-300">
                  {galleryUrls.length} foto{galleryUrls.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Gestiona las imágenes de tu negocio. Puedes agregar, eliminar o reordenar fotos.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/galeria`}
              className="block w-full text-center bg-purple-50 text-purple-700 px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors font-semibold text-sm"
            >
              Gestionar Galería
            </Link>
          </div>

          {/* Mensajes/Chats */}
          <Link
            href={`/app/dashboard/negocios/${business.id}/mensajes`}
            className="block bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 hover:shadow-2xl hover:border-gray-600 transition-all relative"
          >
            {unreadMessagesCount > 0 && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center animate-pulse">
                {unreadMessagesCount}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Mensajes</h3>
                <p className="text-sm text-gray-300">
                  {unreadMessagesCount > 0 
                    ? `${unreadMessagesCount} sin leer` 
                    : "Sistema activo"
                  }
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Responde a las consultas de tus clientes y mantén la comunicación activa.
            </p>
            <div className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors font-semibold text-sm text-center">
              Ver Mensajes
            </div>
          </Link>

          {/* Estadísticas */}
          <Link
            href={`/app/dashboard/negocios/${business.id}/estadisticas`}
            className="block bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20/40 p-6 hover:shadow-2xl hover:border-gray-600 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Estadísticas</h3>
                <p className="text-sm text-gray-300">Análisis</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Visualiza el rendimiento de tu negocio, visitas y más métricas importantes.
            </p>
            <div className="w-full text-center bg-blue-50 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors font-semibold text-sm">
              Ver Estadísticas
            </div>
          </Link>

          {/* Horarios */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20/40 p-6 hover:shadow-2xl transition-all">
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
              Configura los días y horarios de atención de tu negocio.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/horarios`}
              className="block w-full text-center bg-orange-50 text-orange-700 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors font-semibold text-sm"
            >
              Configurar Horarios
            </Link>
          </div>

          {/* Promociones */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Promociones</h3>
                <p className="text-sm text-gray-300">{activePromotionsCount} activa{activePromotionsCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Crea ofertas especiales y promociones para atraer más clientes.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/promociones`}
              className="block w-full text-center bg-pink-50 text-pink-700 px-4 py-2 rounded-xl hover:bg-pink-100 transition-colors font-semibold text-sm"
            >
              Gestionar Promociones
            </Link>
          </div>

          {/* Configuración */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/20/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Configuración</h3>
                <p className="text-sm text-gray-300">General</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Ajusta las configuraciones generales y preferencias de tu negocio.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/editar`}
              className="block w-full text-center bg-gray-50 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-sm"
            >
              Ir a Configuración
            </Link>
          </div>

          {/* Membresía Premium */}
          <div className={`rounded-3xl shadow-2xl border-2 p-6 transition-all ${
            business.is_premium && business.premium_until && new Date(business.premium_until) > new Date()
              ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/40"
              : "bg-transparent backdrop-blur-sm border-white/20/40"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                business.is_premium && business.premium_until && new Date(business.premium_until) > new Date()
                  ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                  : "bg-gradient-to-br from-amber-400/50 to-yellow-500/50"
              }`}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Membresía Premium
                  {business.is_premium && business.premium_until && new Date(business.premium_until) > new Date() && (
                    <span className="text-xs bg-amber-500 text-gray-900 px-2 py-0.5 rounded-full font-bold">
                      ACTIVA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  {business.is_premium && business.premium_until && new Date(business.premium_until) > new Date()
                    ? "✅ Este negocio es Premium"
                    : "Destaca tu negocio"
                  }
                </p>
              </div>
            </div>

            {business.is_premium && business.premium_until && new Date(business.premium_until) > new Date() ? (
              <>
                {/* Información detallada de suscripción */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <p className="text-xs text-blue-300 mb-1">📅 Expira el:</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(business.premium_until).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <p className="text-xs text-green-300 mb-1">⏱️ Días restantes:</p>
                      <p className="text-sm font-semibold text-white">
                        {Math.ceil((new Date(business.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/app/dashboard/negocios/${business.id}/membresia-premium?action=renew`}
                    className="text-center bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold py-2.5 px-3 rounded-xl hover:bg-amber-500/30 hover:border-amber-400 transition-all text-sm"
                  >
                    🔄 Renovar
                  </Link>
                  <Link
                    href={`/app/dashboard/negocios/${business.id}/membresia-premium?action=change`}
                    className="text-center bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold py-2.5 px-3 rounded-xl hover:bg-purple-500/30 hover:border-purple-400 transition-all text-sm"
                  >
                    💎 Cambiar Plan
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  Activa la membresía premium para este negocio y obtén mayor visibilidad, borde dorado y más beneficios.
                </p>
                <Link
                  href={`/app/dashboard/negocios/${business.id}/membresia-premium`}
                  className="block w-full text-center bg-amber-50 text-amber-700 px-4 py-3 rounded-xl hover:bg-amber-100 transition-colors font-semibold text-sm"
                >
                  ⭐ Activar Premium
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

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

