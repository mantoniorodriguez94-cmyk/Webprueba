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
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"
  const isAdmin = user?.user_metadata?.is_admin ?? false
  // Si es empresa, permitir al menos 1 negocio por defecto
  const allowedBusinesses = isCompany 
    ? (user?.user_metadata?.allowed_businesses ?? 5) 
    : 0
  const canCreateMore = isCompany && negocios.length < allowedBusinesses
  
  // Debug: Log de usuario y permisos (temporal para debugging)
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
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 max-w-md mx-4 animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-8 text-lg">Debes iniciar sesión para acceder al dashboard</p>
          <Link 
            href="/app/auth/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-8 py-4 rounded-full hover:shadow-xl transition-all font-semibold text-lg hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
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
    <div className="min-h-screen">
      {/* Header Mejorado */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-[#0288D1]/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#0288D1] to-[#0277BD] bg-clip-text text-transparent flex items-center gap-2">
                📍 Descubre Negocios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {allBusinesses.length} negocios esperándote • Encuentra lo que buscas cerca de ti
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isCompany && (
                <>
                  {/* Botón Mis Negocios con Dropdown */}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => {
                        if (negocios.length === 0) {
                          alert("Por el momento no tienes ningún negocio creado.")
                        } else {
                          setShowBusinessMenu(!showBusinessMenu)
                        }
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-5 py-2.5 rounded-full hover:shadow-xl transition-all hover:scale-105 font-semibold text-sm"
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
                      {negocios.length > 0 && (
                        <svg 
                          className={`w-4 h-4 transition-transform ${showBusinessMenu ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* Dropdown de Mis Negocios */}
                    {showBusinessMenu && negocios.length > 0 && (
                      <>
                        {/* Overlay para cerrar el menú */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowBusinessMenu(false)}
                        />
                        
                        {/* Contenido del dropdown */}
                        <div className="absolute left-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 z-50 overflow-hidden animate-fadeIn">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] p-6 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Mis Negocios
                            </h3>
                            <p className="text-sm text-white/80 mt-1">
                              {negocios.length} de {allowedBusinesses} negocios creados
                            </p>
                          </div>

                          {/* Lista de Negocios */}
                          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                            {negocios.map((negocio) => (
                              <Link
                                key={negocio.id}
                                href={`/app/dashboard/negocios/${negocio.id}/gestionar`}
                                onClick={() => setShowBusinessMenu(false)}
                                className="block p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#0288D1] hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  {/* Logo del negocio */}
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-2 ring-white shadow-md">
                                    {negocio.logo_url ? (
                                      <img
                                        src={negocio.logo_url}
                                        alt={negocio.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#0288D1] font-bold text-lg">
                                        {negocio.name[0]}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Info del negocio */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-[#0288D1] transition-colors">
                                      {negocio.name}
                                    </h4>
                                    {negocio.category && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        {negocio.category}
                                      </p>
                                    )}
                                  </div>

                                  {/* Flecha */}
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0288D1] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </Link>
                            ))}
                          </div>

                          {/* Footer con botón crear nuevo */}
                          {canCreateMore && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                              <Link
                                href="/app/dashboard/negocios/nuevo"
                                onClick={() => setShowBusinessMenu(false)}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-4 py-3 rounded-2xl hover:shadow-xl transition-all font-semibold"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Crear Nuevo Negocio
                              </Link>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {canCreateMore ? (
                    <Link 
                      href="/app/dashboard/negocios/nuevo"
                      className="hidden md:flex items-center gap-2 border-2 border-[#0288D1] text-[#0288D1] px-5 py-2.5 rounded-full hover:bg-[#0288D1] hover:text-white transition-all font-semibold text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear
                    </Link>
                  ) : negocios.length >= allowedBusinesses && (
                    <div className="hidden md:flex items-center gap-2 bg-amber-50 text-amber-700 px-5 py-2.5 rounded-full text-xs font-medium border border-amber-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Límite alcanzado ({negocios.length}/{allowedBusinesses})
                    </div>
                  )}
                </>
              )}
              {!isCompany && !isAdmin && (
                <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium border border-blue-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cuenta de Persona - Para crear negocios, regístrate como Empresa
                </div>
              )}
              
              {/* Botón Mis Mensajes - Solo para usuarios no empresa */}
              {!isCompany && (
                <Link
                  href="/app/dashboard/mis-mensajes"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 text-white px-5 py-2.5 rounded-full hover:shadow-xl transition-all hover:scale-105 font-semibold text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mis Mensajes
                </Link>
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

              {/* Menú de Usuario */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-all"
                  title="Perfil de usuario"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown del menú */}
                {showUserMenu && (
                  <>
                    {/* Overlay para cerrar el menú */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Contenido del dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 z-50 overflow-hidden animate-fadeIn">
                      {/* Header del perfil */}
                      <div className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] p-6 text-white">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/40">
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

                      {/* Información del usuario */}
                      <div className="p-6 space-y-4">
                        {/* Email */}
                        <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                          <svg className="w-5 h-5 text-[#0288D1] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold">Correo electrónico</p>
                            <p className="text-sm text-gray-900 break-words">{user?.email}</p>
                          </div>
                        </div>

                        {/* Rol */}
                        <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                          <svg className="w-5 h-5 text-[#0288D1] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold">Tipo de cuenta</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-sm font-medium ${isCompany ? 'text-[#0288D1]' : 'text-gray-700'}`}>
                                {isCompany ? "Empresa" : "Persona"}
                              </span>
                              {isAdmin && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  Administrador
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Negocios permitidos (solo para empresas) */}
                        {isCompany && (
                          <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                            <svg className="w-5 h-5 text-[#0288D1] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold">Negocios</p>
                              <p className="text-sm text-gray-900">
                                {negocios.length} de {allowedBusinesses} creados
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Fecha de registro */}
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-[#0288D1] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold">Miembro desde</p>
                            <p className="text-sm text-gray-900">
                              {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) : 'No disponible'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botón de cerrar sesión */}
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
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
              </div>
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
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white/40 p-6">
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
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border-2 border-white/40 p-12 text-center">
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
