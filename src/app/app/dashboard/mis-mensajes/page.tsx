// src/app/dashboard/mis-mensajes/page.tsx - REDISEÑO CHAT APP STYLE
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import BottomNav from "@/components/ui/BottomNav"

interface Conversation {
  conversation_id: string
  business_id: string
  business_name: string
  business_logo: string
  last_message: string
  last_message_at: string
  last_message_sender_id: string
  unread_count_user: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  status?: 'sending' | 'sent' | 'error' // UI optimista
  tempId?: string // ID temporal para mensajes optimistas
}

export default function MisMensajesPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Calcular total de mensajes no leídos
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count_user, 0)
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("conversation_details")
          .select("*")
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false })

        if (error) throw error

        setConversations(data || [])
      } catch (error) {
        console.error("Error cargando conversaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    const conversationsChannel = supabase
      .channel('user_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
  }, [user])

  const loadMessages = async (conversation: Conversation) => {
    setSelectedConversation(conversation)

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.conversation_id)
        .order("created_at", { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Marcar mensajes como leídos
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.conversation_id)
        .eq("is_read", false)
        .neq("sender_id", user?.id)

      // Actualizar contador de no leídos
      setConversations(prev =>
        prev.map(conv =>
          conv.conversation_id === conversation.conversation_id
            ? { ...conv, unread_count_user: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error("Error cargando mensajes:", error)
    }
  }

  useEffect(() => {
    if (!selectedConversation || !user) return

    const messagesChannel = supabase
      .channel(`messages_${selectedConversation.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.conversation_id}`
        },
        async (payload) => {
          const newMsg = payload.new as Message
          
          // Evitar duplicados: si ya existe por UI optimista, reemplazarlo
          setMessages(prev => {
            const existingIndex = prev.findIndex(m => 
              m.sender_id === newMsg.sender_id && 
              m.content === newMsg.content &&
              m.status === 'sending'
            )
            
            if (existingIndex !== -1) {
              // Reemplazar mensaje optimista con el real
              const updated = [...prev]
              updated[existingIndex] = { ...newMsg, status: 'sent' }
              return updated
            }
            
            // Si no es mensaje propio optimista, agregarlo (mensaje de otra persona)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Marcar como leído si no es nuestro mensaje
          if (newMsg.sender_id !== user.id) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return

    const messageContent = newMessage.trim()
    const tempId = crypto.randomUUID()
    
    // 1. UI OPTIMISTA: Mostrar mensaje inmediatamente
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      status: 'sending',
      tempId
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")
    
    // 2. Enviar al servidor
    try {
      setSending(true)
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.conversation_id,
          sender_id: user.id,
          content: messageContent,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error
      
      // 3. Actualizar mensaje optimista con datos reales
      if (data) {
        setMessages(prev =>
          prev.map(m =>
            m.tempId === tempId
              ? { ...data, status: 'sent' as const }
              : m
          )
        )
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      
      // 4. Marcar mensaje como error en caso de fallo
      setMessages(prev =>
        prev.map(m =>
          m.tempId === tempId
            ? { ...m, status: 'error' as const }
            : m
        )
      )
      
      // Opcional: dar feedback al usuario
      alert("⚠️ No se pudo enviar el mensaje. Por favor, intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-transparent/50 backdrop-blur-xl rounded-3xl border border-gray-700 p-8 max-w-md">
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

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-sm border-b border-gray-700 flex-shrink-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {selectedConversation ? selectedConversation.business_name : "Mensajes"}
            </h1>
          </div>
          <Link href="/app/dashboard">
            <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Conversaciones */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 flex-col border-r border-gray-700 bg-transparent/50`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400 text-sm">Cargando...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sin mensajes</h3>
                <p className="text-sm text-gray-400">Contacta un negocio para iniciar una conversación</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => loadMessages(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 ${
                    selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gray-700/70' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conv.business_logo ? (
                      <Image src={conv.business_logo} alt={conv.business_name} width={48} height={48} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{conv.business_name}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.last_message_sender_id === user.id && "Tú: "}
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread_count_user > 0 && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{conv.unread_count_user}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Área de Chat */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gray-900`}>
          {selectedConversation ? (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id
                  return (
                    <div key={msg.tempId || msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] sm:max-w-md rounded-2xl px-4 py-2.5 transition-opacity ${
                        msg.status === 'sending' ? 'opacity-70' : 'opacity-100'
                      } ${
                        isOwn 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                      }`}>
                        <p className="text-sm sm:text-base break-words">{msg.content}</p>
                        <span className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                          {msg.status === 'sending' && isOwn && (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {msg.status === 'error' && isOwn && (
                            <svg className="w-3 h-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-transparent/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Selecciona una conversación</h3>
                <p className="text-gray-400">Elige un negocio de la lista para ver tus mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav isCompany={isCompany} unreadCount={totalUnreadCount} />
    </div>
  )
}
