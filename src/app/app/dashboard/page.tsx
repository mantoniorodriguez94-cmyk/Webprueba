// src/app/dashboard/page.tsx - REDISEÑO MOBILE-FIRST MODERNO
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import BusinessFeedCard from "@/components/feed/BusinessFeedCard"
import FilterSidebar, { type FilterState } from "@/components/feed/FilterSidebar"
import HighlightsSidebar from "@/components/feed/HighlightsSidebar"
import { containsText, normalizeText } from "@/lib/searchHelpers"
import BottomNav from "@/components/ui/BottomNav"

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    category: "Todos",
    location: "",
    sortBy: "recent"
  })
  const [activeTab, setActiveTab] = useState<"feed" | "destacados" | "recientes">("feed")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [unreadMessagesByBusiness, setUnreadMessagesByBusiness] = useState<Record<string, number>>({})
  const [unreadMessagesPersonCount, setUnreadMessagesPersonCount] = useState(0)
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const allowedBusinesses = isCompany 
    ? (user?.user_metadata?.allowed_businesses ?? 5) 
    : 0
  const canCreateMore = isCompany && negocios.length < allowedBusinesses
  
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

  const fetchAllBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: businesses, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false })

      if (businessError) throw businessError
      
      try {
        const { data: stats, error: statsError } = await supabase
          .from("business_review_stats")
          .select("*")
        
        if (!statsError && stats) {
          const statsMap = new Map(stats.map(s => [s.business_id, s]))
          const businessesWithStats = (businesses ?? []).map(business => ({
            ...business,
            total_reviews: statsMap.get(business.id)?.total_reviews || 0,
            average_rating: statsMap.get(business.id)?.average_rating || 0
          }))
          
          setAllBusinesses(businessesWithStats)
          setFilteredBusinesses(businessesWithStats)
        } else {
          const businessesWithDefaults = (businesses ?? []).map(business => ({
            ...business,
            total_reviews: 0,
            average_rating: 0
          }))
          setAllBusinesses(businessesWithDefaults)
          setFilteredBusinesses(businessesWithDefaults)
        }
      } catch {
        const businessesWithDefaults = (businesses ?? []).map(business => ({
          ...business,
          total_reviews: 0,
          average_rating: 0
        }))
        setAllBusinesses(businessesWithDefaults)
        setFilteredBusinesses(businessesWithDefaults)
      }
    } catch (err: any) {
      console.error("Error fetching all businesses:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (isCompany) {
        fetchNegocios()
      } else {
        fetchUnreadMessagesForPerson()
      }
      fetchAllBusinesses()
    }
  }, [user, isCompany, fetchNegocios, fetchAllBusinesses, fetchUnreadMessagesForPerson])
  
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

    if (filters.location) {
      filtered = filtered.filter(b =>
        containsText(b.address || "", filters.location)
      )
    }

    switch (filters.sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "popular":
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        break
      case "recent":
      default:
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        break
    }

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 p-8 max-w-md">
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

  const featuredBusinesses = allBusinesses.slice(0, 6)
  
  const recentBusinesses = allBusinesses.filter((business) => {
    if (!business.created_at) return false
    const created = new Date(business.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  })

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
    <div className="min-h-screen bg-gray-900 pb-20 lg:pb-0">
      {/* Header Móvil Moderno */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="px-4 py-3">
          {/* Top Row - Logo y Acciones */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                📍 Encuentra
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {allBusinesses.length} negocios disponibles
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de Búsqueda */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2.5 bg-gray-800 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Botón Filtros */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="lg:hidden p-2.5 bg-gray-800 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-all relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {(filters.category !== "Todos" || filters.location || filters.searchTerm) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </button>

              {/* Menú de Usuario */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
              >
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </button>
            </div>
          </div>

          {/* Tabs de Categorías */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === "feed"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              Todos {filteredBusinesses.length > 0 && `(${filteredBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("recientes")}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === "recientes"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              Recientes {recentBusinesses.length > 0 && `(${recentBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("destacados")}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === "destacados"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              ⭐ Destacados
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* Sidebar Izquierdo (Desktop Only) */}
          <div className="hidden lg:block">
            <FilterSidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Feed Central */}
          <div className="space-y-4">
            {/* Categorías Destacadas (Solo en Tab Feed) */}
            {activeTab === "feed" && topCategories.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-5">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Categorías Populares
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topCategories.map(([category, businesses]) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange({ ...filters, category })}
                      className="p-4 bg-gray-700/50 rounded-2xl hover:bg-blue-500/20 hover:border-blue-500/50 border border-gray-600 transition-all duration-300"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
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
                        <p className="font-semibold text-sm text-white truncate">
                          {category}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {businesses.length}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Negocios */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Cargando negocios...</p>
              </div>
            ) : displayedBusinesses.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {activeTab === "recientes" ? "No hay negocios recientes" : "No se encontraron negocios"}
                </h3>
                <p className="mt-2 text-gray-400">
                  {activeTab === "recientes" 
                    ? "No se han agregado negocios nuevos en los últimos 7 días" 
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
              </div>
            ) : (
              <>
                {displayedBusinesses.map((business) => (
                  <BusinessFeedCard 
                    key={business.id} 
                    business={business}
                    currentUser={user}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </div>

          {/* Sidebar Derecho (Desktop Only) */}
          <div className="hidden lg:block">
            <HighlightsSidebar 
              featuredBusinesses={featuredBusinesses}
            />
          </div>
        </div>
      </div>

      {/* Modal de Filtros (Móvil) */}
      {showFilterModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50 lg:hidden"
            onClick={() => setShowFilterModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-gray-800 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
              <h3 className="text-lg font-bold text-white">Filtros</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
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
          <div className="fixed inset-x-4 top-20 z-50 bg-gray-800 rounded-3xl p-4 animate-fade-in max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Buscar negocios, categorías, ubicación..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full bg-gray-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
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
          <div className="fixed top-16 right-4 w-80 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 z-50 overflow-hidden animate-fade-in">
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
              {!isCompany && (
                <Link
                  href="/app/dashboard/mis-mensajes"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-700 transition-all"
                >
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Mis Mensajes</p>
                    <p className="text-xs text-gray-400">
                      {unreadMessagesPersonCount > 0 
                        ? `${unreadMessagesPersonCount} sin leer` 
                        : "Ver conversaciones"
                      }
                    </p>
                  </div>
                  {unreadMessagesPersonCount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center">
                      {unreadMessagesPersonCount}
                    </div>
                  )}
                </Link>
              )}

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
        unreadCount={unreadMessagesPersonCount}
      />
    </div>
  )
}
