// src/app/dashboard/negocios/[id]/estadisticas/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"

type AnalyticsSummary = {
  total_views: number
  unique_viewers: number
  views_last_7_days: number
  views_last_30_days: number
  total_saves: number
  total_interactions: number
  messages_received: number
  last_viewed_at: string | null
}

type ViewsByDay = {
  view_date: string
  views: number
  unique_viewers: number
}

type InteractionSummary = {
  interaction_type: string
  interaction_count: number
}

export default function EstadisticasPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [viewsByDay, setViewsByDay] = useState<ViewsByDay[]>([])
  const [interactions, setInteractions] = useState<InteractionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const businessId = params?.id as string

  // Verificar permisos
  const isOwner = user?.id === business?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canView = isOwner || isAdmin

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || !user) return

      try {
        // Cargar negocio
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (businessError) throw businessError

        // Verificar permisos
        const hasPermission = businessData.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          alert("No tienes permiso para ver las estadísticas de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(businessData)

        // Cargar estadísticas generales
        const { data: analyticsData, error: analyticsError } = await supabase
          .from("business_analytics_summary")
          .select("*")
          .eq("business_id", businessId)
          .single()

        if (!analyticsError && analyticsData) {
          setAnalytics({
            total_views: analyticsData.total_views || 0,
            unique_viewers: analyticsData.unique_viewers || 0,
            views_last_7_days: analyticsData.views_last_7_days || 0,
            views_last_30_days: analyticsData.views_last_30_days || 0,
            total_saves: analyticsData.total_saves || 0,
            total_interactions: analyticsData.total_interactions || 0,
            messages_received: analyticsData.messages_received || 0,
            last_viewed_at: analyticsData.last_viewed_at
          })
        } else {
          // Si no hay datos, inicializar en ceros
          setAnalytics({
            total_views: 0,
            unique_viewers: 0,
            views_last_7_days: 0,
            views_last_30_days: 0,
            total_saves: 0,
            total_interactions: 0,
            messages_received: 0,
            last_viewed_at: null
          })
        }

        // Cargar vistas por día (últimos 30 días)
        const { data: viewsData, error: viewsError } = await supabase
          .from("business_views_by_day")
          .select("*")
          .eq("business_id", businessId)
          .order("view_date", { ascending: false })
          .limit(30)

        if (!viewsError && viewsData) {
          setViewsByDay(viewsData.reverse()) // Invertir para mostrar cronológicamente
        }

        // Cargar interacciones por tipo
        const { data: interactionsData, error: interactionsError } = await supabase
          .from("business_interactions_summary")
          .select("*")
          .eq("business_id", businessId)

        if (!interactionsError && interactionsData) {
          setInteractions(interactionsData)
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error)
        alert("Error cargando estadísticas")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, user, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (!business || !canView || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso denegado</h2>
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

  const maxViews = Math.max(...viewsByDay.map(d => d.views), 1)
  const growthRate = analytics.views_last_30_days > 0 
    ? Math.round(((analytics.views_last_7_days / 7) / (analytics.views_last_30_days / 30) - 1) * 100)
    : 0

  const interactionTypes = {
    whatsapp: { label: "WhatsApp", icon: "💬", color: "from-green-400 to-green-600" },
    phone: { label: "Llamadas", icon: "📞", color: "from-blue-400 to-blue-600" },
    message: { label: "Mensajes", icon: "✉️", color: "from-purple-400 to-purple-600" },
    share: { label: "Compartidos", icon: "🔗", color: "from-orange-400 to-orange-600" },
    gallery_view: { label: "Galería", icon: "🖼️", color: "from-pink-400 to-pink-600" }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-[#0288D1]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/app/dashboard/negocios/${business.id}/gestionar`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Estadísticas
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {business.name} • Métricas y Análisis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total de Visitas */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-blue-200/40 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              {growthRate !== 0 && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${growthRate > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {growthRate > 0 ? '↑' : '↓'} {Math.abs(growthRate)}%
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{analytics.total_views}</h3>
            <p className="text-sm text-gray-600 font-medium">Visitas Totales</p>
            <p className="text-xs text-gray-500 mt-2">{analytics.unique_viewers} visitantes únicos</p>
          </div>

          {/* Visitas Últimos 7 Días */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-green-200/40 p-6 hover:shadow-2xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{analytics.views_last_7_days}</h3>
            <p className="text-sm text-gray-600 font-medium">Últimos 7 Días</p>
            <p className="text-xs text-gray-500 mt-2">~{Math.round(analytics.views_last_7_days / 7)} visitas/día</p>
          </div>

          {/* Veces Guardado */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-pink-200/40 p-6 hover:shadow-2xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{analytics.total_saves}</h3>
            <p className="text-sm text-gray-600 font-medium">Veces Guardado</p>
            <p className="text-xs text-gray-500 mt-2">Favoritos de usuarios</p>
          </div>

          {/* Mensajes Recibidos */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-purple-200/40 p-6 hover:shadow-2xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{analytics.messages_received}</h3>
            <p className="text-sm text-gray-600 font-medium">Mensajes Recibidos</p>
            <p className="text-xs text-gray-500 mt-2">Conversaciones activas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico de Visitas (2/3) */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Visitas Diarias (Últimos 30 Días)
            </h2>
            
            {viewsByDay.length > 0 ? (
              <div className="space-y-2">
                {viewsByDay.slice(-14).map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 text-right font-medium">
                      {new Date(day.view_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${Math.max((day.views / maxViews) * 100, 5)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{day.views}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-16">
                      {day.unique_viewers} único{day.unique_viewers !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Aún no hay datos suficientes para mostrar el gráfico</p>
              </div>
            )}
          </div>

          {/* Panel Lateral (1/3) */}
          <div className="space-y-6">
            
            {/* Interacciones */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Interacciones
              </h3>
              
              {interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction, index) => {
                    const config = interactionTypes[interaction.interaction_type as keyof typeof interactionTypes] || 
                      { label: interaction.interaction_type, icon: "📊", color: "from-gray-400 to-gray-600" }
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center text-lg`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{config.label}</p>
                          <p className="text-xs text-gray-500">{interaction.interaction_count} veces</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Sin interacciones aún</p>
              )}
            </div>

            {/* Última Actividad */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-amber-200/40 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Última Visita
              </h3>
              {analytics.last_viewed_at ? (
                <p className="text-sm text-gray-700">
                  {new Date(analytics.last_viewed_at).toLocaleDateString('es-ES', { 
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Sin visitas aún</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

