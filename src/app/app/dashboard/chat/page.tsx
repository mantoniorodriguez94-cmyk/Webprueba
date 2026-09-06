// src/app/app/dashboard/chat/page.tsx
// Unified chat inbox — "Mis Consultas" (as client) + "Mi Negocio" (as business owner)
"use client"
import React, { useEffect, useState, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import BottomNav from "@/components/ui/BottomNav"
import { useChatNotifications } from "@/hooks/useChatNotifications"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "consultas" | "negocio"

interface UnifiedConversation {
  conversation_id: string
  business_id: string
  business_name: string
  business_logo: string | null
  user_id: string
  user_name: string | null
  user_email: string | null
  last_message: string
  last_message_at: string
  last_message_sender_id: string
  unread_count_user: number
  unread_count_business: number
  /** Derived client-side — which context this conversation belongs to */
  mode: "client" | "business"
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  status?: "sending" | "sent" | "error"
  tempId?: string
}

interface UserBusiness {
  id: string
  name: string
}

// ─── Inner component (needs Suspense for useSearchParams) ─────────────────────

function ChatInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const { notifyNewMessage, enableNotifications } = useChatNotifications()

  const initialTab: ActiveTab =
    searchParams.get("tab") === "negocio" ? "negocio" : "consultas"

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)
  const [clientConversations, setClientConversations] = useState<UnifiedConversation[]>([])
  const [businessConversations, setBusinessConversations] = useState<UnifiedConversation[]>([])
  const [userBusinesses, setUserBusinesses] = useState<UserBusiness[]>([])
  /** Which of the user's own businesses is currently active in the "Mi Negocio" tab */
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const businessIdParam = searchParams.get("business")

  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  const totalUnreadConsultas = clientConversations.reduce(
    (s, c) => s + (c.unread_count_user || 0),
    0
  )
  const totalUnreadNegocio = businessConversations.reduce(
    (s, c) => s + (c.unread_count_business || 0),
    0
  )
  const totalUnread = totalUnreadConsultas + totalUnreadNegocio

  // ── Scroll ──────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(scrollToBottom, [messages, scrollToBottom])

  // ── Close dropdown on outside click ─────────────────────────────────────────

  useEffect(() => {
    const close = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener("click", close)
      return () => document.removeEventListener("click", close)
    }
  }, [openMenuId])

  // ── Time formatter ───────────────────────────────────────────────────────────

  const formatTime = (ds: string) => {
    const d = new Date(ds)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMs / 3600000)
    const days = Math.floor(diffMs / 86400000)
    if (mins < 1) return "Ahora"
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
  }

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchClientConversations = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("conversation_details")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
    if (error) {
      console.error("[chat] fetchClientConversations:", error)
      return
    }
    setClientConversations(
      (data || []).map((c: any) => ({ ...c, mode: "client" as const }))
    )
  }, [user])

  const fetchBusinessConversations = useCallback(
    async (businesses: UserBusiness[]) => {
      if (!businesses.length) {
        setBusinessConversations([])
        return
      }
      const ids = businesses.map((b) => b.id)
      const { data, error } = await supabase
        .from("conversation_details")
        .select("*")
        .in("business_id", ids)
        .order("last_message_at", { ascending: false })
      if (error) {
        console.error("[chat] fetchBusinessConversations:", error)
        return
      }
      setBusinessConversations(
        (data || []).map((c: any) => ({ ...c, mode: "business" as const }))
      )
    },
    []
  )

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || userLoading) return

    const init = async () => {
      setLoading(true)

      // 1. Fetch businesses this user owns
      const { data: bizData } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id)

      const businesses: UserBusiness[] = (bizData || []).map((b: any) => ({
        id: b.id,
        name: b.name,
      }))
      setUserBusinesses(businesses)
      // Default to the first business; preserve any value already set by URL param
      setSelectedBusinessId((prev) => prev ?? businesses[0]?.id ?? null)

      // 2. Both conversation contexts in parallel
      await Promise.all([
        fetchClientConversations(),
        fetchBusinessConversations(businesses),
      ])

      setLoading(false)
    }

    init()
  }, [user, userLoading, fetchClientConversations, fetchBusinessConversations])

  // ── Auto-open conversation from URL param ─────────────────────────────────────

  useEffect(() => {
    if (!businessIdParam || loading) return

    const allClient = clientConversations.find(
      (c) => c.business_id === businessIdParam
    )
    if (allClient) {
      setActiveTab("consultas")
      loadMessages(allClient)
      router.replace("/app/dashboard/chat", { scroll: false })
      return
    }

    const allBiz = businessConversations.find(
      (c) => c.business_id === businessIdParam
    )
    if (allBiz) {
      setActiveTab("negocio")
      setSelectedBusinessId(allBiz.business_id)
      loadMessages(allBiz)
      router.replace("/app/dashboard/chat?tab=negocio", { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessIdParam, loading, clientConversations, businessConversations])

  // ── Real-time: client conversations ──────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel("unified_chat_client_convs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchClientConversations()
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, fetchClientConversations])

  // ── Real-time: business conversations (one channel per owned business) ────────

  useEffect(() => {
    if (!userBusinesses.length) return
    const channels = userBusinesses.map((biz) =>
      supabase
        .channel(`unified_chat_biz_${biz.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `business_id=eq.${biz.id}`,
          },
          () => fetchBusinessConversations(userBusinesses)
        )
        .subscribe()
    )
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [userBusinesses, fetchBusinessConversations])

  // ── Load messages ─────────────────────────────────────────────────────────────

  const loadMessages = async (conv: UnifiedConversation) => {
    setSelectedConversation(conv)

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.conversation_id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conv.conversation_id)
        .eq("is_read", false)
        .neq("sender_id", user?.id)

      if (conv.mode === "client") {
        await supabase
          .from("conversations")
          .update({ unread_count_user: 0, updated_at: new Date().toISOString() })
          .eq("id", conv.conversation_id)
        setClientConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conv.conversation_id
              ? { ...c, unread_count_user: 0 }
              : c
          )
        )
      } else {
        await supabase
          .from("conversations")
          .update({
            unread_count_business: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conv.conversation_id)
        setBusinessConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conv.conversation_id
              ? { ...c, unread_count_business: 0 }
              : c
          )
        )
      }
    } catch (err) {
      console.error("[chat] loadMessages:", err)
    }
  }

  // ── Real-time: messages in active conversation ────────────────────────────────

  useEffect(() => {
    if (!selectedConversation || !user) return

    const ch = supabase
      .channel(`unified_msgs_${selectedConversation.conversation_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.conversation_id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          let isNewMessageFromOther = false

          setMessages((prev) => {
            const existingIdx = prev.findIndex(
              (m) =>
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content &&
                m.status === "sending"
            )
            if (existingIdx !== -1) {
              const updated = [...prev]
              updated[existingIdx] = { ...newMsg, status: "sent" }
              return updated
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev
            if (newMsg.sender_id !== user.id) isNewMessageFromOther = true
            return [...prev, newMsg]
          })

          if (isNewMessageFromOther) {
            const senderLabel =
              selectedConversation.mode === "client"
                ? selectedConversation.business_name
                : selectedConversation.user_name ||
                  selectedConversation.user_email ||
                  "Cliente"
            const preview =
              newMsg.content.substring(0, 50) +
              (newMsg.content.length > 50 ? "..." : "")
            notifyNewMessage(senderLabel, preview)
          }

          if (newMsg.sender_id !== user.id) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)

            const countField =
              selectedConversation.mode === "client"
                ? "unread_count_user"
                : "unread_count_business"
            await supabase
              .from("conversations")
              .update({ [countField]: 0 })
              .eq("id", selectedConversation.conversation_id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [selectedConversation, user, notifyNewMessage])

  // ── Send message ──────────────────────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return

    const content = newMessage.trim()
    const tempId = crypto.randomUUID()

    const optimistic: Message = {
      id: tempId,
      sender_id: user.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      status: "sending",
      tempId,
    }

    setMessages((prev) => [...prev, optimistic])
    setNewMessage("")

    try {
      setSending(true)
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.conversation_id,
          sender_id: user.id,
          content,
          is_read: false,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...data, status: "sent" as const } : m))
        )
      }
    } catch (err) {
      console.error("[chat] handleSendMessage:", err)
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "error" as const } : m))
      )
      alert("⚠️ No se pudo enviar el mensaje. Por favor, intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  // ── Delete conversation ───────────────────────────────────────────────────────

  const handleDeleteConversation = async (
    conv: UnifiedConversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    if (
      !confirm(
        "¿Eliminar esta conversación? Todos los mensajes se borrarán permanentemente."
      )
    )
      return

    try {
      let query = supabase
        .from("conversations")
        .delete()
        .eq("id", conv.conversation_id)

      if (conv.mode === "client") {
        query = query.eq("user_id", user?.id)
      } else {
        query = query.eq("business_id", conv.business_id)
      }

      const { error } = await query
      if (error) throw error

      if (conv.mode === "client") {
        setClientConversations((prev) =>
          prev.filter((c) => c.conversation_id !== conv.conversation_id)
        )
      } else {
        setBusinessConversations((prev) =>
          prev.filter((c) => c.conversation_id !== conv.conversation_id)
        )
      }

      if (selectedConversation?.conversation_id === conv.conversation_id) {
        setSelectedConversation(null)
        setMessages([])
      }
      setOpenMenuId(null)
    } catch (err: any) {
      alert(`No se pudo eliminar: ${err.message || "Error desconocido"}`)
    }
  }

  // ── Auth guard ────────────────────────────────────────────────────────────────

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-300">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-700 p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-3">Acceso restringido</h2>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para ver tus mensajes</p>
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

  // ── Derived ───────────────────────────────────────────────────────────────────

  /** Conversations visible in the "Mi Negocio" sidebar — scoped to the active business */
  const filteredBusinessConversations = selectedBusinessId
    ? businessConversations.filter((c) => c.business_id === selectedBusinessId)
    : businessConversations

  const activeConversations =
    activeTab === "consultas" ? clientConversations : filteredBusinessConversations

  /** Display name of the currently selected business context */
  const selectedBusinessName =
    userBusinesses.find((b) => b.id === selectedBusinessId)?.name ?? ""

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full flex flex-col pb-0">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
          <Link
            href="/app/dashboard"
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white flex-shrink-0"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>

          {selectedConversation && (
            <button
              onClick={() => { setSelectedConversation(null); setMessages([]) }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 lg:hidden"
              aria-label="Volver a la lista"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <h1 className="text-xl font-bold text-white flex items-center gap-2 truncate min-w-0">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="truncate">
              {selectedConversation
                ? selectedConversation.mode === "client"
                  ? selectedConversation.business_name
                  : selectedConversation.user_name ||
                    selectedConversation.user_email ||
                    "Cliente"
                : "Mensajes"}
            </span>
          </h1>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Sidebar ── */}
        <div
          className={`${
            selectedConversation ? "hidden lg:flex" : "flex"
          } w-full lg:w-96 flex-col border-r border-white/10 bg-gray-900/50 min-h-0`}
        >
          {/* Tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {/* Tab: Mis Consultas */}
            <button
              onClick={() => {
                setActiveTab("consultas")
                setSelectedConversation(null)
                setMessages([])
              }}
              className={`flex-1 py-3 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "consultas"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">Mis Consultas</span>
              {totalUnreadConsultas > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 flex-shrink-0">
                  {totalUnreadConsultas > 9 ? "9+" : totalUnreadConsultas}
                </span>
              )}
            </button>

            {/* Tab: Mi Negocio */}
            <button
              onClick={() => {
                setActiveTab("negocio")
                setSelectedConversation(null)
                setMessages([])
              }}
              className={`flex-1 py-3 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "negocio"
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="truncate">Mi Negocio</span>
              {totalUnreadNegocio > 0 && (
                <span className="bg-emerald-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 flex-shrink-0">
                  {totalUnreadNegocio > 9 ? "9+" : totalUnreadNegocio}
                </span>
              )}
            </button>
          </div>

          {/* ── Business context switcher (only when owning 2+ businesses) ── */}
          {activeTab === "negocio" && userBusinesses.length > 1 && (
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-white/10 bg-gray-900/60">
              <label className="text-xs text-gray-400 mb-1.5 block font-medium tracking-wide">
                Viendo mensajes de:
              </label>
              <div className="relative">
                <select
                  value={selectedBusinessId ?? ""}
                  onChange={(e) => {
                    setSelectedBusinessId(e.target.value)
                    setSelectedConversation(null)
                    setMessages([])
                  }}
                  className="w-full appearance-none bg-gray-800 border border-white/10 text-white text-sm font-semibold rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer transition-colors hover:border-white/20"
                >
                  {userBusinesses.map((biz) => (
                    <option key={biz.id} value={biz.id} className="bg-gray-800 text-white font-normal">
                      {biz.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Conversation list */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                <p className="mt-3 text-white/50 text-sm">Cargando...</p>
              </div>
            </div>
          ) : activeConversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {activeTab === "consultas" ? "Sin consultas" : "Sin mensajes"}
                </h3>
                <p className="text-sm text-gray-400">
                  {activeTab === "consultas"
                    ? "Contacta un negocio para iniciar una conversación"
                    : userBusinesses.length === 0
                    ? "Registra un negocio para recibir mensajes de clientes"
                    : selectedBusinessName
                    ? `${selectedBusinessName} aún no tiene mensajes de clientes`
                    : "Los clientes te escribirán desde el perfil de tu negocio"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {activeConversations.map((conv) => {
                const isClient = conv.mode === "client"
                const displayName = isClient
                  ? conv.business_name
                  : conv.user_name || conv.user_email || "Cliente"
                const avatarLetter = (displayName?.[0] ?? "?").toUpperCase()
                const unread = isClient
                  ? conv.unread_count_user
                  : conv.unread_count_business
                const isSelected =
                  selectedConversation?.conversation_id === conv.conversation_id

                return (
                  <div
                    key={conv.conversation_id}
                    className={`relative w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                      isSelected
                        ? isClient
                          ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                          : "bg-emerald-600/10 border-l-2 border-l-emerald-500"
                        : ""
                    }`}
                  >
                    <button
                      onClick={() => loadMessages(conv)}
                      className="absolute inset-0 w-full h-full"
                      aria-label={`Abrir conversación con ${displayName}`}
                    />

                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg ${
                        isClient
                          ? "bg-gradient-to-br from-blue-600 to-purple-600"
                          : "bg-gradient-to-br from-emerald-600 to-teal-600"
                      }`}
                    >
                      {isClient && conv.business_logo ? (
                        <Image
                          src={conv.business_logo}
                          alt={conv.business_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {avatarLetter}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {displayName}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {conv.last_message_sender_id === user.id && "Tú: "}
                        {conv.last_message}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                          isClient ? "bg-blue-500" : "bg-emerald-500"
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{unread}</span>
                      </div>
                    )}

                    {/* Options menu */}
                    <div className="relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(
                            openMenuId === conv.conversation_id
                              ? null
                              : conv.conversation_id
                          )
                        }}
                        className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="Opciones"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {openMenuId === conv.conversation_id && (
                        <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                          <button
                            onClick={(e) => handleDeleteConversation(conv, e)}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div
          className={`${
            selectedConversation ? "flex" : "hidden lg:flex"
          } flex-1 flex-col bg-gray-900/30 min-h-0`}
        >
          {selectedConversation ? (
            <>
              {/* ── Context identity bar ── */}
              {selectedConversation.mode === "business" ? (
                /* Business owner context — highly visible */
                <div className="flex-shrink-0 px-4 py-3 border-b border-emerald-500/30 bg-emerald-950/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-semibold leading-none mb-0.5">
                      Respondiendo en nombre de
                    </p>
                    <p className="text-sm font-bold text-emerald-200 truncate">
                      🏢 {selectedBusinessName || selectedConversation.business_name}
                    </p>
                  </div>
                </div>
              ) : (
                /* Client context — subtle blue bar */
                <div className="flex-shrink-0 px-4 py-2 border-b border-white/10 bg-blue-900/20 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-blue-300 truncate">
                    Conversación con: {selectedConversation.business_name}
                  </span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id
                  return (
                    <div
                      key={msg.tempId || msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-md rounded-2xl px-4 py-2.5 transition-opacity ${
                          msg.status === "sending" ? "opacity-70" : "opacity-100"
                        } ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20"
                            : "bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm sm:text-base break-words">{msg.content}</p>
                        <div
                          className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                            isOwn ? "text-blue-200" : "text-white/50"
                          }`}
                        >
                          {msg.status === "sending" && isOwn && (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                          {msg.status === "error" && isOwn && (
                            <svg className="w-3 h-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isOwn &&
                            msg.status !== "sending" &&
                            msg.status !== "error" && (
                              <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-3 pb-4 mb-16 lg:mb-0">
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-row bg-gray-800/80 rounded-full p-1.5 items-center gap-2 shadow-lg">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onClick={enableNotifications}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-transparent text-white px-4 py-2.5 rounded-full focus:outline-none placeholder:text-gray-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="w-11 h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-3">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-400">
                  {activeTab === "consultas"
                    ? "Elige un negocio de la lista para ver tu conversación"
                    : "Elige un cliente de la lista para responderle"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav isCompany={isCompany} unreadCount={totalUnread} />
    </div>
  )
}

// ─── Exported page (Suspense boundary for useSearchParams) ────────────────────

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500" />
        </div>
      }
    >
      <ChatInner />
    </Suspense>
  )
}
