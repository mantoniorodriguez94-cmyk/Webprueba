// src/app/dashboard/page.tsx
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fetchNegocios = useCallback(async () => {
    if (!user && !userLoading) {
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false })

      setLoading(false)
      if (error) {
        console.error("Error fetching negocios:", error)
        alert(error.message)
        return
      }
      setNegocios(data ?? [])
    } catch (err: any) {
      setLoading(false)
      console.error("Error:", err)
      alert(err.message ?? String(err))
    }
  }, [user, userLoading])

  useEffect(() => {
    fetchNegocios()
  }, [fetchNegocios])

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
      alert("Negocio eliminado")
    } catch (err: any) {
      setDeletingId(null)
      console.error("Error eliminando:", err)
      alert("Error eliminando: " + (err.message ?? String(err)))
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Gestiona tus negocios</p>
          </div>
          <Link 
            href="/app/dashboard/negocios/nuevo"
            className="bg-[#0288D1] hover:bg-[#0277BD] text-white px-6 py-3 rounded-full shadow-md transition-all hover:scale-105 font-semibold"
          >
            + Nuevo negocio
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando negocios...</p>
          </div>
        ) : negocios.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Aún no hay negocios</h3>
            <p className="mt-2 text-gray-600">Comienza creando tu primer negocio</p>
            <Link 
              href="/app/dashboard/negocios/nuevo"
              className="mt-6 inline-block bg-[#0288D1] hover:bg-[#0277BD] text-white px-6 py-3 rounded-full transition-colors font-semibold"
            >
              Crear primer negocio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {negocios.map((negocio) => (
              <div 
                key={negocio.id} 
                className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB]">
                  {negocio.logo_url ? (
                    <Image 
                      src={negocio.logo_url}
                      alt={negocio.name}
                      className="w-full h-full object-cover"
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
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{negocio.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {negocio.description || "Sin descripción"}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/app/dashboard/negocios/${negocio.id}/editar`}
                      className="flex-1 text-center px-4 py-2 border-2 border-[#0288D1] text-[#0288D1] rounded-full hover:bg-[#0288D1] hover:text-white transition-colors font-semibold text-sm"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(negocio.id)}
                      disabled={deletingId === negocio.id}
                      className="flex-1 px-4 py-2 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === negocio.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
