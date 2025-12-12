"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/ui/BottomNav"

export default function PerfilPage() {
  const { user, loading: userLoading } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  // ============================================================
  // 🔥 DETECTAR SI EL USUARIO ES ADMIN
  // ============================================================
  useEffect(() => {
    const loadAdminFlag = async () => {
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      setIsAdmin(data?.is_admin === true)
    }

    loadAdminFlag()
  }, [user])

  const router = useRouter()
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [negocios, setNegocios] = useState<{id: string, name?: string, is_premium?: boolean, premium_until?: string}[]>([])
  const [premiumSubscription, setPremiumSubscription] = useState<{
    business_id: string
    business_name?: string
    premium_until?: string
    plan?: { name?: string, max_photos?: number }
  } | null>(null)

  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  // Verificar si el usuario tiene al menos un negocio premium activo
  const isPremium = negocios.some(negocio =>
    negocio.is_premium === true &&
    negocio.premium_until &&
    new Date(negocio.premium_until) > new Date()
  )

  // Calcular días restantes de premium
  const getDaysRemaining = (premiumUntil?: string): number | null => {
    if (!premiumUntil) return null
    const now = new Date()
    const end = new Date(premiumUntil)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const fullName = user?.user_metadata?.full_name || "Usuario"
  const email = user?.email || ""
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // ============================================================
  // Mensajes no leídos
  // ============================================================
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return

      try {
        if (isCompany) {
          const { data: businesses } = await supabase
            .from("businesses")
            .select("id, name, is_premium, premium_until")
            .eq("owner_id", user.id)

          if (!businesses || businesses.length === 0) {
            setNegocios([])
            setPremiumSubscription(null)
            setUnreadMessagesCount(0)
            return
          }

          setNegocios(businesses)

          // Encontrar el negocio premium activo con suscripción
          const activePremiumBusiness = businesses.find(b =>
            b.is_premium === true &&
            b.premium_until &&
            new Date(b.premium_until) > new Date()
          )

          if (activePremiumBusiness) {
            // Cargar suscripción con plan
            const { data: subscription } = await supabase
              .from("business_subscriptions")
              .select(`
                business_id,
                premium_plans(name, max_photos)
              `)
              .eq("business_id", activePremiumBusiness.id)
              .eq("status", "active")
              .single()

            setPremiumSubscription({
              business_id: activePremiumBusiness.id,
              business_name: activePremiumBusiness.name,
              premium_until: activePremiumBusiness.premium_until || undefined,
              plan: subscription?.premium_plans as { name?: string, max_photos?: number } | undefined
            })
          } else {
            setPremiumSubscription(null)
          }
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
          const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", user.id)

          if (!conversations || conversations.length === 0) {
            setUnreadMessagesCount(0)
            return
          }

          const ids = conversations.map(c => c.id)

          const { data: unreadMessages } = await supabase
            .from("messages")
            .select("id")
            .in("conversation_id", ids)
            .eq("is_read", false)
            .neq("sender_id", user.id)

          setUnreadMessagesCount(unreadMessages?.length || 0)
        }
      } catch (err) {
        console.error("Error fetching unread messages:", err)
      }
    }

    fetchUnreadMessages()
    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [user, isCompany])

  // ============================================================
  // Logout
  // ============================================================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // ============================================================
  // Convertir a cuenta negocio
  // ============================================================
  const handleConvertToCompany = async () => {
    if (!user) return

    try {
      setConverting(true)

      const { error } = await supabase.auth.updateUser({
        data: {
          role: "company",
          allowed_businesses: 1
        }
      })

      if (error) throw error

      alert("Tu cuenta ha sido convertida a tipo Negocio. Recarga la página.")
      window.location.reload()
    } catch (error: any) {
      console.error("Error:", error)
      alert("Error al convertir cuenta: " + (error.message || String(error)))
    } finally {
      setConverting(false)
      setShowConvertModal(false)
    }
  }

  // ============================================================
  // Loaders y validaciones base
  // ============================================================
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-transparent/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md">
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

  // ============================================================
  // CONTENIDO PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gray-900/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </h1>

            <Link href="/app/dashboard">
              <button className="p-2 bg-transparent rounded-full text-gray-400 hover:text-white hover:bg-transparent transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* INFORMACIÓN DE USUARIO */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

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

                {/* ============================================
                    🔥 INSIGNIA ADMIN
                  ============================================ */}
                {isAdmin && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/30 text-red-100 border border-red-300/30">
                    🔥 Administrador
                  </span>
                )}

              </div>
            </div>
          </div>
        </div>
        {/* ============================================
            OPCIONES PARA USUARIOS PERSONALES
        ============================================ */}
        {!isCompany && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Opciones de Cuenta</h3>

            {/* Mis Mensajes */}
            <Link href="/app/dashboard/mis-mensajes">
              <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/40 transition-all cursor-pointer flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Mis Mensajes</h4>
                  <p className="text-sm text-gray-400">Ver tus conversaciones</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Convertirse en Empresa */}
            <button
              onClick={() => setShowConvertModal(true)}
              className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl border-2 border-purple-500/40 p-5 hover:border-purple-400 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-purple-500/30 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Convertirme en Usuario Negocio</h4>
                <p className="text-sm text-gray-400">Crea y gestiona negocios</p>
              </div>
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ============================================
            OPCIONES PARA USUARIOS NEGOCIO
        ============================================ */}
        {isCompany && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white px-2">Gestión de Negocios</h3>

            {/* Mis Negocios */}
            <Link href="/app/dashboard/mis-negocios">
              <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/40 transition-all cursor-pointer flex items-center gap-4">
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
            </Link>

            {/* Mensajes del Negocio */}
            <Link href={
              negocios.length === 1
                ? `/app/dashboard/negocios/${negocios[0].id}/mensajes`
                : "/app/dashboard/mis-negocios"
            }>
              <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/40 transition-all cursor-pointer flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Mensajes del Negocio</h4>
                  <p className="text-sm text-gray-400">Consultas de clientes</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Mensajes como Cliente */}
            <Link href="/app/dashboard/mis-mensajes">
              <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 hover:border-white/40 transition-all cursor-pointer flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Mensajes como Cliente</h4>
                  <p className="text-sm text-gray-400">Conversaciones iniciadas por ti</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Sección Invitaciones */}
            <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/20">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Invita a tus amigos</h4>
                  <p className="text-sm text-gray-400">Comparte Encuentra y ayuda a crecer la comunidad</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/app/auth/register?ref=${user?.id || ''}`}
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                  <button
                    onClick={async () => {
                      const link = `${window.location.origin}/app/auth/register?ref=${user?.id || ''}`
                      try {
                        await navigator.clipboard.writeText(link)
                        alert('Enlace copiado al portapapeles')
                      } catch (err) {
                        console.error('Error copiando:', err)
                      }
                    }}
                    className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-semibold"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Comparte este enlace con tus amigos. Cuando se registren, quedará registrado en tu cuenta.
                </p>
              </div>
            </div>

            {/* Sección Premium Mejorada */}
            <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isPremium 
                    ? premiumSubscription && getDaysRemaining(premiumSubscription.premium_until) !== null && getDaysRemaining(premiumSubscription.premium_until)! <= 7
                      ? "bg-orange-500/20"
                      : "bg-yellow-500/20"
                    : "bg-gray-500/20"
                }`}>
                  <svg className={`w-6 h-6 ${
                    isPremium ? "text-yellow-400" : "text-gray-400"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Plan Premium</h4>
                  <p className="text-sm text-gray-400">
                    {isPremium 
                      ? premiumSubscription && getDaysRemaining(premiumSubscription.premium_until) !== null && getDaysRemaining(premiumSubscription.premium_until)! <= 7
                        ? "⚠️ Por vencer pronto"
                        : "✨ Activo"
                      : "🆓 Plan Gratuito"}
                  </p>
                </div>
                {isPremium && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                    Activo
                  </span>
                )}
              </div>

              {isPremium && premiumSubscription ? (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <p className="text-xs text-yellow-200 mb-2">📍 Negocio Premium:</p>
                    <p className="text-sm font-semibold text-white">{premiumSubscription.business_name || "N/A"}</p>
                  </div>
                  
                  {premiumSubscription.premium_until && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-xs text-blue-300 mb-1">📅 Expira el:</p>
                        <p className="text-sm font-semibold text-white">
                          {new Date(premiumSubscription.premium_until).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                        <p className="text-xs text-green-300 mb-1">⏱️ Días restantes:</p>
                        <p className="text-sm font-semibold text-white">
                          {getDaysRemaining(premiumSubscription.premium_until) !== null 
                            ? `${getDaysRemaining(premiumSubscription.premium_until)} días`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {premiumSubscription.plan && (
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <p className="text-xs text-purple-300 mb-2">💎 Límites del Plan:</p>
                      <div className="space-y-1 text-sm text-white">
                        <p>• 📸 Fotos máx. en galería: <span className="font-semibold">{premiumSubscription.plan.max_photos || "10"}</span></p>
                        <p>• 🏢 Negocios permitidos: <span className="font-semibold">Ilimitados</span></p>
                        <p>• ⭐ Aparece en destacados: <span className="font-semibold">Sí</span></p>
                      </div>
                    </div>
                  )}

                  <Link href={`/app/dashboard/negocios/${premiumSubscription.business_id}/premium`}>
                    <button className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 font-semibold py-3 rounded-xl hover:border-yellow-400 transition-all">
                      Ver Detalles de Suscripción
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Actualiza tu plan para obtener más visibilidad y funcionalidades para tu negocio.
                  </p>
                  {negocios.length === 0 ? (
                    <Link href="/app/dashboard/negocios/nuevo">
                      <button className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40 text-purple-300 font-semibold py-3 rounded-xl hover:border-purple-400 transition-all">
                        Crear Mi Primer Negocio
                      </button>
                    </Link>
                  ) : negocios.length === 1 ? (
                    <Link href={`/app/dashboard/negocios/${negocios[0].id}/premium`}>
                      <button className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 font-semibold py-3 rounded-xl hover:border-yellow-400 transition-all">
                        ⭐ Mejorar a Premium
                      </button>
                    </Link>
                  ) : (
                    <Link href="/app/dashboard/mis-negocios">
                      <button className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 font-semibold py-3 rounded-xl hover:border-yellow-400 transition-all">
                        ⭐ Elegir Negocio Premium
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================
            SECCIÓN CONFIGURACIÓN (BOTÓN ADMIN AQUÍ)
        ============================================ */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-white px-2">Configuración</h3>

          {/* 🔥 BOTÓN PANEL ADMIN — SOLO PARA ADMINISTRADORES */}
          {isAdmin && (
            <Link href="/app/admin">
              <div className="
                bg-gradient-to-br from-red-500/20 to-orange-500/20 
                rounded-3xl border border-red-500/40 
                p-5 cursor-pointer
                hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10
                transition-all flex items-center gap-4
              ">
                
                <div className="w-12 h-12 bg-red-500/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-white">Panel de Control Admin</h4>
                  <p className="text-sm text-gray-300">Administración interna del sistema</p>
                </div>

                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Tarjeta Preferencias */}
          <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/20 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center">
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

        {/* CERRAR SESIÓN */}
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

      {/* MODAL CONVERTIR A NEGOCIO */}
      {showConvertModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setShowConvertModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Convertir a Cuenta Negocio</h3>

              <p className="text-gray-300 text-sm mb-6">
                Convertirás tu cuenta personal en una cuenta de negocio. Podrás crear y gestionar negocios propios.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleConvertToCompany}
                  disabled={converting}
                  className="w-full bg-purple-500 hover:bg-purple-600 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {converting ? "Convirtiendo..." : "Convertir ahora"}
                </button>

                <button
                  onClick={() => setShowConvertModal(false)}
                  disabled={converting}
                  className="w-full bg-gray-600/40 hover:bg-gray-600/60 py-3 rounded-xl text-white font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FOOTER NAV */}
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
