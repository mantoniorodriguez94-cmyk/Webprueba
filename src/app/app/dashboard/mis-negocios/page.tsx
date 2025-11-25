// src/app/dashboard/mis-negocios/page.tsx - REDISEÑO MOBILE PREMIUM
"use client"
import React, { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import BottomNav from "@/components/ui/BottomNav"

export default function MisNegociosPage() {
  const { user, loading: userLoading } = useUser()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const allowedBusinesses = user?.user_metadata?.allowed_businesses ?? 0
  const userRole = user?.user_metadata?.role ?? "person"
  const isPremium = user?.user_metadata?.is_premium ?? false
  const canCreateMore = negocios.length < allowedBusinesses
  const isCompany = userRole === "company"
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  
  // Obtener mensajes no leídos para usuarios negocio
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user || !isCompany || negocios.length === 0) return
      
      try {
        const businessIds = negocios.map(b => b.id)
        const { data: conversations } = await supabase
          .from("conversations")
          .select("id")
          .in("business_id", businessIds)
        
        if (!conversations || conversations.length === 0) {
          setUnreadMessagesCount(0)
          return
        }
        
        const conversationIds = conversations.map(c => c.id)
        const { data: unreadMessages } = await supabase
          .from("messages")
          .select("id")
          .in("conversation_id", conversationIds)
          .eq("is_read", false)
          .neq("sender_id", user.id)
        
        setUnreadMessagesCount(unreadMessages?.length || 0)
      } catch (err) {
        console.error("Error fetching unread messages:", err)
      }
    }
    
    fetchUnreadMessages()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [user, isCompany, negocios])
  
  const handleCreateBusiness = () => {
    if (canCreateMore) {
      window.location.href = "/app/dashboard/negocios/nuevo"
    } else {
      // Mostrar alerta premium
      if (!isPremium) {
        alert("⭐ Para crear más negocios, únete al Plan Premium.\n\n✨ Beneficios Premium:\n• Crear de 2 a 5 negocios\n• 1 semana en Destacados o Patrocinados\n• Borde dorado especial para un negocio\n\nPrecio: $5 USD/mes")
      } else {
        alert("⚠️ Has alcanzado el límite de negocios de tu plan Premium.")
      }
    }
  }

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700 p-8 max-w-md">
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

  if (!isCompany) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 pb-24">
        <div className="text-center bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700 p-8 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cuenta de Persona</h2>
          <p className="text-gray-400 mb-6">Para crear y gestionar negocios, necesitas una cuenta tipo Empresa</p>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all font-semibold"
          >
            Volver al inicio
          </Link>
        </div>
        <BottomNav 
          isCompany={isCompany} 
          unreadCount={unreadMessagesCount}
          messagesHref="/app/dashboard/mis-mensajes"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Mis Negocios
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {negocios.length} de {allowedBusinesses} negocios creados
              </p>
            </div>

            <Link href="/app/dashboard">
              <button className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="bg-gray-800/50 rounded-3xl border border-gray-700 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-300">Límite de negocios</span>
            <span className="text-sm font-bold text-blue-400">{negocios.length}/{allowedBusinesses}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                negocios.length >= allowedBusinesses 
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${(negocios.length / allowedBusinesses) * 100}%` }}
            />
          </div>
          {!canCreateMore && (
            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Has alcanzado el límite de negocios
            </p>
          )}
        </div>

        {/* Lista de Negocios */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando negocios...</p>
          </div>
        ) : negocios.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tienes negocios aún</h3>
            <p className="text-gray-400 mb-6">Crea tu primer negocio y comienza a recibir clientes</p>
            <button 
              onClick={handleCreateBusiness}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear mi primer negocio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {negocios.map((negocio) => (
              <div key={negocio.id} className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
                {/* Logo/Header */}
                <div className="p-5 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-gray-600 flex-shrink-0">
                      {negocio.logo_url ? (
                        <Image
                          src={negocio.logo_url}
                          alt={negocio.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xl">
                          {negocio.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate text-lg">{negocio.name}</h3>
                      {negocio.category && (
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {negocio.category}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {negocio.description && (
                  <div className="px-5 py-4 border-b border-gray-700">
                    <p className="text-sm text-gray-400 line-clamp-2">{negocio.description}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="p-4 grid grid-cols-2 gap-2">
                  <Link href={`/app/dashboard/negocios/${negocio.id}/gestionar`}>
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gestionar
                    </button>
                  </Link>
                  <Link href={`/app/dashboard/negocios/${negocio.id}`}>
                    <button className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-2xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </button>
                  </Link>
                </div>

                {/* Botón Eliminar */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleDelete(negocio.id)}
                    disabled={deletingId === negocio.id}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-2.5 rounded-2xl transition-all border border-red-500/30 disabled:opacity-50"
                  >
                    {deletingId === negocio.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB - Botón Flotante para Crear Negocio */}
      <button 
        onClick={handleCreateBusiness}
        className="fixed bottom-24 lg:bottom-8 right-6 z-40 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
        <div className="absolute bottom-20 right-0 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
          {canCreateMore ? "Crear negocio" : "⭐ Plan Premium"}
        </div>
      </button>

      <BottomNav 
        isCompany={isCompany} 
        unreadCount={unreadMessagesCount}
        messagesHref={
          negocios.length === 1 
            ? `/app/dashboard/negocios/${negocios[0].id}/mensajes`
            : "/app/dashboard/mis-negocios"
        }
      />
    </div>
  )
}
