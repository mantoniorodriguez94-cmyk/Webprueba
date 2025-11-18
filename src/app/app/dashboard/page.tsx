// src/app/dashboard/page.tsx
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
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const allowedBusinesses = user?.user_metadata?.allowed_businesses ?? 0
  const userRole = user?.user_metadata?.role ?? "person"
  const canCreateMore = negocios.length < allowedBusinesses
  const isCompany = userRole === "company"
  const isAdmin = user?.user_metadata?.is_admin ?? false
  // Obtener negocios del usuario actual (para empresas)
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
    } catch (err: any) {
      console.error("Error fetching user businesses:", err)
    }
  }, [user])

  // Obtener todos los negocios públicos (para el feed)
  const fetchAllBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAllBusinesses(data ?? [])
      setFilteredBusinesses(data ?? [])
    } catch (err: any) {
      console.error("Error fetching all businesses:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (isCompany) {
        fetchNegocios() // Obtener negocios del usuario si es empresa
      }
      fetchAllBusinesses() // Siempre obtener todos los negocios para el feed
    }
  }, [user, isCompany, fetchNegocios, fetchAllBusinesses])

  // Aplicar filtros con búsqueda mejorada
  useEffect(() => {
    let filtered = [...allBusinesses]

    // Filtrar por búsqueda (MEJORADO: insensible a mayúsculas y acentos)
    if (filters.searchTerm) {
      filtered = filtered.filter(b => {
        // Buscar en nombre, descripción y dirección
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

    // Filtrar por categoría (MEJORADO: insensible a mayúsculas y acentos)
    if (filters.category && filters.category !== "Todos") {
      filtered = filtered.filter(b =>
        normalizeText(b.category || "") === normalizeText(filters.category)
      )
    }

    // Filtrar por ubicación (MEJORADO: insensible a mayúsculas y acentos)
    if (filters.location) {
      filtered = filtered.filter(b =>
        containsText(b.address || "", filters.location)
      )
    }

    // Ordenar
    switch (filters.sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "popular":
        // Por ahora ordenar por fecha de creación también
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

      // Actualizar la lista de negocios del usuario
      setNegocios(prev => prev.filter(x => x.id !== id))
      
      // Actualizar también la lista de todos los negocios (para el feed)
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

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al dashboard</p>
          <Link 
            href="/app/auth/login"
            className="bg-[#0288D1] text-white px-6 py-3 rounded-full hover:bg-[#0277BD] transition-colors"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    )
  }

  // Obtener negocios destacados (los primeros 6)
  const featuredBusinesses = allBusinesses.slice(0, 6)
  
  // Obtener negocios recientes (últimos 7 días)
  const recentBusinesses = allBusinesses.filter((business) => {
    if (!business.created_at) return false
    const created = new Date(business.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  })

  // Agrupar negocios por categoría
  const businessesByCategory = allBusinesses.reduce((acc, business) => {
    const category = business.category || "Otros"
    if (!acc[category]) acc[category] = []
    acc[category].push(business)
    return acc
  }, {} as Record<string, Business[]>)

  // Obtener categorías con más negocios
  const topCategories = Object.entries(businessesByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)

  // Determinar qué negocios mostrar según la pestaña activa
  const displayedBusinesses = 
    activeTab === "destacados" ? featuredBusinesses :
    activeTab === "recientes" ? recentBusinesses :
    filteredBusinesses

  // VISTA UNIFICADA - Feed principal para todos los usuarios
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white">
      {/* Header Mejorado */}
      <header className="bg-white bg-opacity-95 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#0288D1] to-[#0277BD] bg-clip-text text-transparent">
                🌟 Descubre Negocios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {allBusinesses.length} negocios esperándote • Encuentra lo que buscas cerca de ti
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isCompany && (
                <>
                  <Link
                    href="/app/dashboard/mis-negocios"
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-5 py-2.5 rounded-full hover:shadow-xl transition-all hover:scale-105 font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Mis Negocios
                    {negocios.length > 0 && (
                      <span className="bg-white text-[#0288D1] px-2 py-0.5 rounded-full text-xs font-bold">
                        {negocios.length}
                      </span>
                    )}
                  </Link>
                  {canCreateMore && (
                    <Link 
                      href="/app/dashboard/negocios/nuevo"
                      className="hidden md:flex items-center gap-2 border-2 border-[#0288D1] text-[#0288D1] px-5 py-2.5 rounded-full hover:bg-[#0288D1] hover:text-white transition-all font-semibold text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">Inicio</span>
              </Link>
            </div>
          </div>

          {/* Tabs de Secciones */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <nav className="flex gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab("feed")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  activeTab === "feed"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Todos
                <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                  {filteredBusinesses.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("recientes")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  activeTab === "recientes"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recientes
                {recentBusinesses.length > 0 && (
                  <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                    {recentBusinesses.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("destacados")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  activeTab === "destacados"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Destacados
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Feed Layout */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_360px] gap-6">
          {/* Sidebar Izquierdo - Filtros */}
          <FilterSidebar onFilterChange={handleFilterChange} />

          {/* Feed Central */}
          <div className="space-y-6">
            {/* Categorías Destacadas */}
            {activeTab === "feed" && topCategories.length > 0 && (
              <div className="bg-white rounded-3xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Categorías Populares
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topCategories.map(([category, businesses]) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange({ ...filters, category })}
                      className="p-4 border-2 border-gray-100 rounded-2xl hover:border-[#0288D1] hover:bg-[#E3F2FD] transition-all duration-300 group"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">
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
                        <p className="font-semibold text-sm text-gray-900 group-hover:text-[#0288D1] transition-colors">
                          {category}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {businesses.length} negocios
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando negocios...</p>
              </div>
            ) : displayedBusinesses.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {activeTab === "recientes" ? "No hay negocios recientes" : "No se encontraron negocios"}
                </h3>
                <p className="mt-2 text-gray-600">
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

          {/* Sidebar Derecho - Destacados y Eventos */}
          <HighlightsSidebar 
            featuredBusinesses={featuredBusinesses}
          />
        </div>
      </div>
    </div>
  )
}
