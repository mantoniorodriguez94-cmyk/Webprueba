// src/app/dashboard/mis-negocios/page.tsx
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"

export default function MisNegociosPage() {
  const { user, loading: userLoading } = useUser()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const allowedBusinesses = user?.user_metadata?.allowed_businesses ?? 0
  const userRole = user?.user_metadata?.role ?? "person"
  const canCreateMore = negocios.length < allowedBusinesses
  const isCompany = userRole === "company"

  // Obtener negocios del usuario actual
  const fetchNegocios = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNegocios(data ?? [])
    } catch (err: any) {
      console.error("Error fetching user businesses:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && isCompany) {
      fetchNegocios()
    }
  }, [user, isCompany, fetchNegocios])

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

  if (!user || !isCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceso restringido</h2>
          <p className="text-gray-600 mb-6">Solo las empresas pueden acceder a esta sección</p>
          <Link 
            href="/app/dashboard"
            className="bg-[#0288D1] text-white px-6 py-3 rounded-full hover:bg-[#0277BD] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white">
      {/* Header */}
      <header className="bg-white bg-opacity-95 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#0288D1] to-[#0277BD] bg-clip-text text-transparent">
                📊 Mis Negocios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra tus negocios • {negocios.length} de {allowedBusinesses} creados
              </p>
            </div>
            <div className="flex gap-3">
              {canCreateMore && (
                <Link 
                  href="/app/dashboard/negocios/nuevo"
                  className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] hover:shadow-xl text-white px-6 py-3 rounded-full transition-all hover:scale-105 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo negocio
                </Link>
              )}
              <Link
                href="/app/dashboard"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full transition-all font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Volver al feed</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Negocios</p>
                <p className="text-2xl font-bold text-gray-900">{negocios.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{allowedBusinesses - negocios.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Límite Total</p>
                <p className="text-2xl font-bold text-gray-900">{allowedBusinesses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Uso de negocios: {negocios.length}/{allowedBusinesses}
            </span>
            <span className="text-sm font-semibold text-[#0288D1]">
              {Math.round((negocios.length / allowedBusinesses) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] h-3 rounded-full transition-all duration-500"
              style={{ width: `${(negocios.length / allowedBusinesses) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tus negocios...</p>
          </div>
        ) : negocios.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Crea tu primer negocio</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comienza a gestionar tu presencia en línea y conecta con más clientes
            </p>
            {canCreateMore && (
              <Link 
                href="/app/dashboard/negocios/nuevo"
                className="inline-block bg-gradient-to-r from-[#0288D1] to-[#0277BD] hover:shadow-xl text-white px-8 py-3 rounded-full transition-all hover:scale-105 font-semibold"
              >
                Crear mi negocio
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {negocios.map((negocio) => (
              <div 
                key={negocio.id} 
                className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] overflow-hidden">
                  {negocio.logo_url ? (
                    <Image 
                      src={negocio.logo_url}
                      alt={negocio.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      width={400}
                      height={300}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-[#0288D1] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  {/* Badge de categoría */}
                  {negocio.category && (
                    <div className="absolute top-3 right-3 bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-[#0288D1]">{negocio.category}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#0288D1] transition-colors">
                    {negocio.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                    {negocio.description || "Sin descripción"}
                  </p>

                  {/* Info adicional */}
                  <div className="space-y-2 mb-4">
                    {negocio.address && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="line-clamp-1">{negocio.address}</span>
                      </div>
                    )}
                    {(negocio.phone || negocio.whatsapp) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{negocio.phone || negocio.whatsapp}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/app/dashboard/negocios/${negocio.id}/editar`}
                      className="flex-1 text-center px-4 py-2.5 border-2 border-[#0288D1] text-[#0288D1] rounded-full hover:bg-[#0288D1] hover:text-white transition-all font-semibold text-sm hover:scale-105"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(negocio.id)}
                      disabled={deletingId === negocio.id}
                      className="flex-1 px-4 py-2.5 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    >
                      {deletingId === negocio.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




