// src/app/dashboard/page.tsx - REDISEÑO MOBILE-FIRST MODERNO
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { Business } from "@/types/business"
import BusinessFeedCard from "@/components/feed/BusinessFeedCard"
import type { FilterState } from "@/components/feed/FilterSidebar"
import { containsText, normalizeText } from "@/lib/searchHelpers"
import BottomNav from "@/components/ui/BottomNav"

// Lazy-load de componentes pesados para mejorar performance
const FilterSidebar = dynamic(
  () => import("@/components/feed/FilterSidebar"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-6 animate-pulse">
        <div className="h-6 w-24 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    ),
  }
)

const RightSidebar = dynamic(
  () => import("@/components/dashboard/RightSidebar"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 animate-pulse">
            <div className="h-6 w-32 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  }
)

export default function DashboardPage() {
  const router = useRouter()
  const searchParamsInitial = useSearchParams()
  const { user, loading: userLoading } = useUser()
  
  // Leer parámetros de URL para filtros de ubicación
  const stateIdParam = searchParamsInitial.get("state_id") ? parseInt(searchParamsInitial.get("state_id")!) : null
  const municipalityIdParam = searchParamsInitial.get("municipality_id") ? parseInt(searchParamsInitial.get("municipality_id")!) : null
  
  const [negocios, setNegocios] = useState<Business[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: searchParamsInitial.get("search") || "",
    category: searchParamsInitial.get("category") || "Todos",
    location: "", // Deprecated, mantener para compatibilidad
    state_id: stateIdParam,
    municipality_id: municipalityIdParam,
    sortBy: (searchParamsInitial.get("sortBy") as "recent" | "name" | "popular") || "recent"
  })
  const [activeTab, setActiveTab] = useState<"feed" | "destacados" | "recientes">("feed")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [unreadMessagesByBusiness, setUnreadMessagesByBusiness] = useState<Record<string, number>>({})
  const [unreadMessagesPersonCount, setUnreadMessagesPersonCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"
  const allowedBusinesses = isCompany 
    ? (isAdmin ? 999 : (user?.user_metadata?.allowed_businesses ?? 5))
    : 0
  const canCreateMore = isCompany && (isAdmin || negocios.length < allowedBusinesses)

  // ============================================================
  // 🔥 DETECTAR SI EL USUARIO ES ADMIN (desde tabla profiles)
  // ============================================================
  // ⚠️ IMPORTANTE: Usamos API route para leer is_admin desde profiles
  // NO desde user_metadata que puede estar desincronizado
  useEffect(() => {
    const loadAdminFlag = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        // Usar API route del servidor para leer is_admin desde profiles
        // ⚠️ IMPORTANTE: Usar ruta relativa (no URL absoluta) para que funcione en local y producción
        const response = await fetch('/api/user/is-admin', {
          cache: 'no-store' // Evitar cache
        })
        const data = await response.json()
        
        console.log('🔍 Dashboard - Verificación admin:', {
          isAdmin: data.isAdmin,
          error: data.error,
          userId: user.id,
          debug: data.debug
        })
        
        if (data.isAdmin === true) {
          setIsAdmin(true)
          console.log('✅ Usuario es administrador (dashboard)')
        } else {
          setIsAdmin(false)
          if (data.error) {
            console.warn('⚠️ Error verificando admin:', data.error)
          }
        }
      } catch (error) {
        console.error('❌ Error verificando admin en dashboard:', error)
        setIsAdmin(false)
      }
    }

    loadAdminFlag()
  }, [user])
  
  // [MANTENER TODA LA LÓGICA ORIGINAL - NO CAMBIAR]
  useEffect(() => {
    if (user && process.env.NODE_ENV === 'development') {
      console.log('Dashboard User Debug:', {
        userId: user.id,
        email: user.email,
        userMetadata: user.user_metadata,
        isAdmin,
        isCompany,
        userRole
      })
    }
  }, [user, isAdmin, isCompany, userRole])
  
  const fetchNegocios = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNegocios(data ?? [])
      
      if (data && data.length > 0) {
        await fetchUnreadMessages(data.map(b => b.id))
      }
    } catch (err: any) {
      console.error("Error fetching user businesses:", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  
  const fetchUnreadMessages = useCallback(async (businessIds: string[]) => {
    if (!user || businessIds.length === 0) return
    
    try {
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id, business_id")
        .in("business_id", businessIds)
      
      if (convError) throw convError
      if (!conversations || conversations.length === 0) return
      
      const conversationIds = conversations.map(c => c.id)
      const { data: unreadMessages, error: msgError } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id)
      
      if (msgError) throw msgError
      
      const unreadCounts: Record<string, number> = {}
      conversations.forEach(conv => {
        const count = unreadMessages?.filter(msg => msg.conversation_id === conv.id).length || 0
        if (count > 0) {
          unreadCounts[conv.business_id] = (unreadCounts[conv.business_id] || 0) + count
        }
      })
      
      setUnreadMessagesByBusiness(unreadCounts)
    } catch (err: any) {
      console.error("Error fetching unread messages:", err)
    }
  }, [user])
  
  const fetchUnreadMessagesForPerson = useCallback(async () => {
    if (!user) return
    
    try {
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
      
      if (convError) throw convError
      if (!conversations || conversations.length === 0) {
        setUnreadMessagesPersonCount(0)
        return
      }
      
      const conversationIds = conversations.map(c => c.id)
      const { data: unreadMessages, error: msgError } = await supabase
        .from("messages")
        .select("id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id)
      
      if (msgError) throw msgError
      
      setUnreadMessagesPersonCount(unreadMessages?.length || 0)
    } catch (err: any) {
      console.error("Error fetching unread messages for person:", err)
    }
  }, [user])

  const fetchAllBusinesses = useCallback(async (stateId?: number | null, municipalityId?: number | null) => {
    try {
      setLoading(true)
      
      let query = supabase
        .from("businesses")
        .select("*")

      // Aplicar filtros de ubicación si están presentes
      if (stateId) {
        query = query.eq("state_id", stateId)
      }
      
      if (municipalityId) {
        query = query.eq("municipality_id", municipalityId)
      }

      const { data: businesses, error: businessError } = await query.order("created_at", { ascending: false })

      if (businessError) throw businessError
      
      try {
        // Obtener estadísticas de reviews
        const { data: stats, error: statsError } = await supabase
          .from("business_review_stats")
          .select("*")
        
        // Obtener conteo de visitas por negocio
        // Solo intentar si el usuario está autenticado
        let viewsData = null
        let savesData = null
        let sharesData = null
        
        if (user) {
          try {
            const viewsResponse = await supabase
              .from("business_views")
              .select("business_id")
            
            if (!viewsResponse.error) {
              viewsData = viewsResponse.data
            } else {
              console.warn("No se pudieron obtener vistas (puede ser por permisos):", viewsResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo vistas:", err)
          }
          
          try {
            const savesResponse = await supabase
              .from("business_saves")
              .select("business_id")
            
            if (!savesResponse.error) {
              savesData = savesResponse.data
            } else {
              console.warn("No se pudieron obtener guardados:", savesResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo guardados:", err)
          }
          
          try {
            const sharesResponse = await supabase
              .from("business_interactions")
              .select("business_id")
              .eq("interaction_type", "share")
            
            if (!sharesResponse.error) {
              sharesData = sharesResponse.data
            } else {
              console.warn("No se pudieron obtener compartidos:", sharesResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo compartidos:", err)
          }
        }
        
        // Crear mapas de conteos (manejar casos donde los datos son null)
        const viewsMap = new Map<string, number>()
        if (viewsData) {
          viewsData.forEach(v => {
            viewsMap.set(v.business_id, (viewsMap.get(v.business_id) || 0) + 1)
          })
        }
        
        const savesMap = new Map<string, number>()
        if (savesData) {
          savesData.forEach(s => {
            savesMap.set(s.business_id, (savesMap.get(s.business_id) || 0) + 1)
          })
        }
        
        const sharesMap = new Map<string, number>()
        if (sharesData) {
          sharesData.forEach(sh => {
            sharesMap.set(sh.business_id, (sharesMap.get(sh.business_id) || 0) + 1)
          })
        }
        
        const statsMap = new Map(stats?.map(s => [s.business_id, s]) || [])
        
        const businessesWithStats = (businesses ?? []).map(business => ({
          ...business,
          total_reviews: statsMap.get(business.id)?.total_reviews || 0,
          average_rating: statsMap.get(business.id)?.average_rating || 0,
          views_count: viewsMap.get(business.id) || 0,
          saved_count: savesMap.get(business.id) || 0,
          shared_count: sharesMap.get(business.id) || 0
        }))
        
        // Ordenar: Premium activos primero, luego por fecha de creación
        const sortedBusinesses = businessesWithStats.sort((a, b) => {
          const now = new Date()
          const aIsPremium = a.is_premium && (!a.premium_until || new Date(a.premium_until) > now)
          const bIsPremium = b.is_premium && (!b.premium_until || new Date(b.premium_until) > now)
          
          // Premium primero
          if (aIsPremium && !bIsPremium) return -1
          if (!aIsPremium && bIsPremium) return 1
          
          // Si ambos son premium o ambos no son premium, ordenar por fecha (más reciente primero)
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        })
        
        setAllBusinesses(sortedBusinesses)
        setFilteredBusinesses(sortedBusinesses)
      } catch {
        const businessesWithDefaults = (businesses ?? []).map(business => ({
          ...business,
          total_reviews: 0,
          average_rating: 0,
          views_count: 0,
          saved_count: 0,
          shared_count: 0
        }))
        
        // Ordenar: Premium activos primero, luego por fecha de creación
        const sortedBusinesses = businessesWithDefaults.sort((a, b) => {
          const now = new Date()
          const aIsPremium = a.is_premium && (!a.premium_until || new Date(a.premium_until) > now)
          const bIsPremium = b.is_premium && (!b.premium_until || new Date(b.premium_until) > now)
          
          if (aIsPremium && !bIsPremium) return -1
          if (!aIsPremium && bIsPremium) return 1
          
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        })
        
      setAllBusinesses(sortedBusinesses)
      setFilteredBusinesses(sortedBusinesses)
    }
  } catch (err: any) {
    console.error("Error fetching all businesses:", err)
  } finally {
    setLoading(false)
  }
}, [user])

  useEffect(() => {
    if (user) {
      if (isCompany) {
        fetchNegocios()
      } else {
        fetchUnreadMessagesForPerson()
      }
      fetchAllBusinesses(stateIdParam, municipalityIdParam)
    }
  }, [user, isCompany, fetchNegocios, fetchAllBusinesses, fetchUnreadMessagesForPerson, stateIdParam, municipalityIdParam])
  
  // Recargar negocios cuando la página recibe foco (útil después de crear un negocio)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchAllBusinesses(stateIdParam, municipalityIdParam)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, fetchAllBusinesses, stateIdParam, municipalityIdParam])
  
  useEffect(() => {
    if (!user || !isCompany || negocios.length === 0) return
    
    const interval = setInterval(() => {
      fetchUnreadMessages(negocios.map(b => b.id))
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, isCompany, negocios, fetchUnreadMessages])
  
  useEffect(() => {
    if (!user || isCompany) return
    
    const interval = setInterval(() => {
      fetchUnreadMessagesForPerson()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, isCompany, fetchUnreadMessagesForPerson])

  useEffect(() => {
    let filtered = [...allBusinesses]

    if (filters.searchTerm) {
      filtered = filtered.filter(b => {
        const searchableTexts = [
          b.name || "",
          b.description || "",
          b.address || "",
          b.category || ""
        ]
        
        return searchableTexts.some(text => 
          containsText(text, filters.searchTerm)
        )
      })
    }

    if (filters.category && filters.category !== "Todos") {
      filtered = filtered.filter(b =>
        normalizeText(b.category || "") === normalizeText(filters.category)
      )
    }

    // Nota: Los filtros de state_id y municipality_id ya se aplican en fetchAllBusinesses
    // Solo mantener el filtro de location (texto) para compatibilidad si existe
    if (filters.location) {
      filtered = filtered.filter(b =>
        containsText(b.address || "", filters.location)
      )
    }

    // Helper para verificar si un negocio tiene premium activo
    const isPremiumActive = (business: Business) => {
      const now = new Date()
      return business.is_premium && (!business.premium_until || new Date(business.premium_until) > now)
    }

    // Ordenar según el criterio seleccionado, pero siempre con premium primero
    filtered.sort((a, b) => {
      // Premium siempre primero
      const aIsPremium = isPremiumActive(a)
      const bIsPremium = isPremiumActive(b)
      
      if (aIsPremium && !bIsPremium) return -1
      if (!aIsPremium && bIsPremium) return 1
      
      // Dentro del mismo grupo (premium o no), aplicar el orden seleccionado
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "popular":
        case "recent":
        default:
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
      }
    })

    setFilteredBusinesses(filtered)
  }, [filters, allBusinesses])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este negocio?")) return
    try {
      setDeletingId(id)
      
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id)
        
      if (error) throw error

      setNegocios(prev => prev.filter(x => x.id !== id))
      setAllBusinesses(prev => prev.filter(x => x.id !== id))
      setFilteredBusinesses(prev => prev.filter(x => x.id !== id))
      
      setDeletingId(null)
      alert("Negocio eliminado exitosamente")
    } catch (err: any) {
      setDeletingId(null)
      console.error("Error eliminando:", err)
      alert("Error eliminando: " + (err.message ?? String(err)))
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 p-8 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Acceso restringido</h2>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para continuar</p>
          <Link 
            href="/app/auth/login"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all font-semibold"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  // DESTACADOS: Negocios con interacciones reales O premium activo
  // DESTACADOS: Solo negocios manualmente destacados por administrador
  // - is_featured = true Y featured_until > now
  // - NO incluir negocios premium (solo destacados manualmente)
  const featuredBusinesses = allBusinesses
    .filter((business) => {
      // Verificar si está destacado manualmente
      const isFeatured = business.is_featured === true
      
      // Verificar que la fecha de destacado no haya expirado
      const now = new Date()
      const featuredUntil = business.featured_until 
        ? new Date(business.featured_until) 
        : null
      
      const isFeaturedActive = isFeatured && 
        (featuredUntil === null || featuredUntil > now)
      
      // SOLO incluir si está destacado y activo
      // EXCLUIR completamente los premium de esta sección
      return isFeaturedActive
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  
  // RECIENTES: Negocios creados en los últimos 7 días
  const recentBusinesses = allBusinesses
    .filter((business) => {
      if (!business.created_at) {
        console.log('⚠️ Negocio sin created_at:', business.name)
        return false
      }
      
      const created = new Date(business.created_at)
      const now = new Date()
      const diffTime = now.getTime() - created.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      const isRecent = diffDays >= 0 && diffDays < 7
      
      // Debug: log SIEMPRE (no solo en development) para diagnosticar
      console.log('🔍 Negocio:', business.name, '| created_at:', business.created_at, '| días:', diffDays.toFixed(2), '| es reciente:', isRecent)
      
      // Incluir negocios de hace menos de 7 días (no redondear para ser más preciso)
      return isRecent
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación: más recientes primero
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    })
  
  // Debug adicional - SIEMPRE visible
  console.log('📊 Total negocios:', allBusinesses.length)
  console.log('📅 Negocios recientes (últimos 7 días):', recentBusinesses.length)
  console.log('🎯 Tab activo:', activeTab)

  const businessesByCategory = allBusinesses.reduce((acc, business) => {
    const category = business.category || "Otros"
    if (!acc[category]) acc[category] = []
    acc[category].push(business)
    return acc
  }, {} as Record<string, Business[]>)

  const topCategories = Object.entries(businessesByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)

  const displayedBusinesses = 
    activeTab === "destacados" ? featuredBusinesses :
    activeTab === "recientes" ? recentBusinesses :
    filteredBusinesses

  // ========== NUEVO UI MOBILE-FIRST ==========
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header Móvil Moderno */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
        <div className="px-4 py-4 lg:px-6">
          {/* Top Row - Logo y Acciones */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">📍</span>
                Encuentra
              </h1>
              <p className="text-xs lg:text-sm text-gray-400 mt-1">
                {allBusinesses.length} {allBusinesses.length === 1 ? 'negocio disponible' : 'negocios disponibles'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón de Búsqueda - Solo visible en Desktop */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="hidden lg:flex p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Menú de Usuario */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105"
              >
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </button>
            </div>
          </div>

          {/* Tabs de Categorías */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "feed"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 border border-white/10"
              }`}
            >
              Todos {filteredBusinesses.length > 0 && `(${filteredBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("recientes")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "recientes"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 border border-white/10"
              }`}
            >
              Recientes {recentBusinesses.length > 0 && `(${recentBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("destacados")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "destacados"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 border border-white/10"
              }`}
            >
              ⭐ Destacados
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* Sidebar Izquierdo (Desktop Only) */}
          <div className="hidden lg:block">
            <FilterSidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Feed Central */}
          <div className="space-y-4">
            {/* Categorías Destacadas (Solo en Tab Feed) */}
            {activeTab === "feed" && topCategories.length > 0 && (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl shadow-black/20">
                <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  Categorías Populares
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {topCategories.map(([category, businesses]) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange({ ...filters, category })}
                      className="group relative p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl hover:from-blue-500/20 hover:to-purple-500/20 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                          {category === "Restaurantes" && "🍽️"}
                          {category === "Tiendas" && "🛍️"}
                          {category === "Servicios" && "🔧"}
                          {category === "Salud" && "⚕️"}
                          {category === "Educación" && "📚"}
                          {category === "Tecnología" && "💻"}
                          {category === "Entretenimiento" && "🎭"}
                          {category === "Deportes" && "⚽"}
                          {category === "Belleza" && "💄"}
                          {!["Restaurantes", "Tiendas", "Servicios", "Salud", "Educación", "Tecnología", "Entretenimiento", "Deportes", "Belleza"].includes(category) && "📦"}
                        </div>
                        <p className="font-semibold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                          {category}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 group-hover:text-gray-300 transition-colors">
                          {businesses.length} {businesses.length === 1 ? 'negocio' : 'negocios'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de Filtros Colapsable (Solo Mobile) */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-black/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold">Filtra por Categoría, Ubicación o Nombre</span>
                  {(filters.category !== "Todos" || filters.location || filters.searchTerm) && (
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                  )}
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Panel de Filtros Desplegable */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showFilters ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/20">
                  <FilterSidebar onFilterChange={handleFilterChange} />
                </div>
              </div>
            </div>

            {/* Lista de Negocios */}
            {loading ? (
              <div className="text-center py-16">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium">Cargando negocios...</p>
              </div>
            ) : displayedBusinesses.length === 0 ? (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-16 text-center shadow-xl shadow-black/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <svg className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {activeTab === "recientes" 
                    ? "No hay negocios recientes" 
                    : activeTab === "destacados"
                    ? "Aún no hay negocios destacados"
                    : "No se encontraron negocios"}
                </h3>
                <p className="mt-3 text-gray-400 max-w-md mx-auto">
                  {activeTab === "recientes" 
                    ? "No se han agregado negocios nuevos en los últimos 7 días" 
                    : activeTab === "destacados"
                    ? "Los negocios destacados son asignados manualmente por los administradores"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {displayedBusinesses.map((business, index) => (
                  <div 
                    key={business.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                  >
                    <BusinessFeedCard 
                      business={business}
                      currentUser={user}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Derecho (Desktop Only) - Nuevo diseño modular */}
          <RightSidebar />
        </div>
      </div>

      {/* Modal de Filtros (Móvil) */}
      {showFilterModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50 lg:hidden"
            onClick={() => setShowFilterModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-transparent rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-transparent">
              <h3 className="text-lg font-bold text-white">Filtros</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 rounded-full hover:bg-transparent text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar onFilterChange={(newFilters) => {
                handleFilterChange(newFilters)
                setShowFilterModal(false)
              }} />
            </div>
          </div>
        </>
      )}

      {/* Modal de Búsqueda */}
      {showSearchModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="fixed inset-x-4 top-20 z-50 bg-transparent rounded-3xl p-4 animate-fade-in max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Buscar negocios, categorías, ubicación..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full bg-transparent text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </>
      )}

      {/* Menú de Usuario (Dropdown) */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserMenu(false)}
          />
          <div className="fixed top-16 right-4 w-80 bg-transparent backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 z-50 overflow-hidden animate-fade-in">
            {/* Header del perfil */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {user?.user_metadata?.full_name || "Usuario"}
                  </h3>
                  <p className="text-sm text-white/80">
                    {userRole === "company" ? "Cuenta Empresa" : "Cuenta Personal"}
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="p-4 space-y-2">
              {/* Mensajes del Negocio - Solo para usuarios empresa */}
              {isCompany && negocios.length === 1 ? (
                // Usuario negocio con 1 solo negocio: ir directo a mensajes del negocio
                <Link
                  href={`/app/dashboard/negocios/${negocios[0].id}/mensajes`}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-transparent transition-all"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Mensajes del Negocio</p>
                    <p className="text-xs text-gray-400">
                      {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0) > 0
                        ? `${Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0)} sin leer`
                        : "Clientes que te escriben"}
                    </p>
                  </div>
                  {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0) > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center animate-pulse">
                      {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0)}
                    </div>
                  )}
                </Link>
              ) : isCompany && negocios.length > 1 ? (
                // Usuario negocio con múltiples negocios: ir a mis-negocios para elegir
                <Link
                  href="/app/dashboard/mis-negocios"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-transparent transition-all"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Mensajes del Negocio</p>
                    <p className="text-xs text-gray-400">
                      {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0) > 0
                        ? `${Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0)} sin leer`
                        : "Selecciona un negocio"}
                    </p>
                  </div>
                  {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0) > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center animate-pulse">
                      {Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0)}
                    </div>
                  )}
                </Link>
              ) : null}

              {/* Mis Mensajes como Cliente - Para TODOS los usuarios */}
              <Link
                href="/app/dashboard/mis-mensajes"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {isCompany ? "Mensajes como Cliente" : "Mis Mensajes"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {unreadMessagesPersonCount > 0 
                      ? `${unreadMessagesPersonCount} sin leer` 
                      : isCompany ? "Negocios que contactaste" : "Ver conversaciones"}
                  </p>
                </div>
                {unreadMessagesPersonCount > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center animate-pulse">
                    {unreadMessagesPersonCount}
                  </div>
                )}
              </Link>

              {/* Mis Negocios - Solo para usuarios empresa */}
              {isCompany && (
                <Link
                  href="/app/dashboard/mis-negocios"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-transparent transition-all"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Mis Negocios</p>
                    <p className="text-xs text-gray-400">Gestionar negocios</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {/* Perfil - Para todos */}
              <Link
                href="/app/dashboard/perfil"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-white">Mi Perfil</p>
                  <p className="text-xs text-gray-400">Configuración y más</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <div className="flex items-center gap-3 p-3 border-t border-gray-700 mt-2 pt-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-white break-all">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-2xl transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation (Móvil) */}
      <BottomNav 
        isCompany={isCompany} 
        unreadCount={isCompany 
          ? Object.values(unreadMessagesByBusiness).reduce((sum, count) => sum + count, 0)
          : unreadMessagesPersonCount
        }
        messagesHref={
          isCompany 
            ? negocios.length === 1 
              ? `/app/dashboard/negocios/${negocios[0].id}/mensajes`
              : "/app/dashboard/mis-negocios"
            : "/app/dashboard/mis-mensajes"
        }
      />
    </div>
  )
}
