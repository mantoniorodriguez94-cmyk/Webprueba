"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/ui/BottomNav"

export default function PerfilPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [negocios, setNegocios] = useState<{id: string}[]>([])

  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"
  const isPremium = user?.user_metadata?.is_premium ?? false
  const fullName = user?.user_metadata?.full_name || "Usuario"
  const email = user?.email || ""
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  
  // Obtener mensajes no leídos
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return
      
      try {
        if (isCompany) {
          // Para usuarios negocio: contar mensajes de todos sus negocios
          const { data: businesses } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", user.id)
          
          if (!businesses || businesses.length === 0) {
            setNegocios([])
            setUnreadMessagesCount(0)
            return
          }
          
          setNegocios(businesses)
          const businessIds = businesses.map(b => b.id)
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
        } else {
          // Para usuarios persona: contar mensajes de sus conversaciones
          const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", user.id)
          
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
        }
      } catch (err) {
        console.error("Error fetching unread messages:", err)
      }
    }
    
    fetchUnreadMessages()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [user, isCompany])
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleConvertToCompany = async () => {
    if (!user) return
    
    try {
      setConverting(true)
      
      // Actualizar el metadata del usuario en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          role: "company",
          allowed_businesses: 1 // Por defecto, 1 negocio sin premium
        }
      })

      if (error) throw error

      alert("✅ Tu cuenta ha sido convertida a tipo Negocio exitosamente. Recarga la página para ver los cambios.")
      window.location.reload()
    } catch (error: any) {
      console.error("Error al convertir cuenta:", error)
      alert("Error al convertir cuenta: " + (error.message || String(error)))
    } finally {
      setConverting(false)
      setShowConvertModal(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando perfil...</p>
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

  return (
    <div className="min-h-screen bg-gray-900 pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </h1>
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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Información del Usuario */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
              {fullName[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{fullName}</h2>
              <p className="text-blue-100 mb-2">{email}</p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isCompany 
                    ? "bg-purple-500/30 text-purple-100 border border-purple-300/30" 
                    : "bg-green-500/30 text-green-100 border border-green-300/30"
                }`}>
                  {isCompany ? "👔 Cuenta Negocio" : "👤 Cuenta Personal"}
                </span>
                {isPremium && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/30 text-yellow-100 border border-yellow-300/30">
                    ⭐ Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones para Usuarios Persona */}
        {!isCompany && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Opciones de Cuenta</h3>
            
            {/* Mis Mensajes */}
            <Link href="/app/dashboard/mis-mensajes">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-5 hover:border-gray-600 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Mis Mensajes</h4>
                    <p className="text-sm text-gray-400">Ver todas tus conversaciones</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Convertirse en Usuario Negocio */}
            <button
              onClick={() => setShowConvertModal(true)}
              className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl border-2 border-purple-500/50 p-5 hover:border-purple-400 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-white">Convertirme en Usuario Negocio</h4>
                  <p className="text-sm text-gray-400">Crea y gestiona tus propios negocios</p>
                </div>
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Opciones para Usuarios Negocio */}
        {isCompany && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Gestión de Negocios</h3>
            
            {/* Mis Negocios */}
            <Link href="/app/dashboard/mis-negocios">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-5 hover:border-gray-600 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Mis Negocios</h4>
                    <p className="text-sm text-gray-400">Ver y gestionar tus negocios</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Mensajes del Negocio */}
            <Link href="/app/dashboard/mis-mensajes">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-5 hover:border-gray-600 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Mensajes</h4>
                    <p className="text-sm text-gray-400">Consultas de clientes</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Plan Premium */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl border-2 border-yellow-500/50 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-yellow-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                      ⭐ Suscripción Premium
                      <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded-full">$5 USD/mes</span>
                    </h4>
                    <p className="text-sm text-gray-300 mb-4">Desbloquea más funciones para tu negocio</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Crear de 2 a 5 negocios
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        1 semana en sección Destacados
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Borde dorado especial en un negocio
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-2xl transition-all hover:scale-[1.02]">
                      Próximamente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección Configuración */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white px-2">Configuración</h3>
          
          {/* Preferencias */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Preferencias</h4>
                <p className="text-sm text-gray-400">Configuración de la cuenta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-400 font-bold py-4 rounded-3xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Conversión */}
      {showConvertModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowConvertModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-3xl p-6 max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Convertir a Cuenta Negocio?</h3>
              <p className="text-gray-400 text-sm">
                Tu cuenta será convertida a tipo Negocio y podrás crear y gestionar hasta 1 negocio (o más con Premium).
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleConvertToCompany}
                disabled={converting}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {converting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Convirtiendo...
                  </span>
                ) : (
                  "Sí, convertir ahora"
                )}
              </button>
              <button
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav 
        isCompany={isCompany} 
        unreadCount={unreadMessagesCount}
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

