// src/app/dashboard/mis-mensajes/page.tsx - REDISEÑO CHAT APP STYLE
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import BottomNav from "@/components/ui/BottomNav"
import { useChatNotifications } from "@/hooks/useChatNotifications"

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
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const businessIdParam = searchParams.get('business')
  
  // 🔔 Hook para notificaciones completas (sonido + navegador)
  const { notifyNewMessage, enableNotifications } = useChatNotifications()
  
  // Calcular total de mensajes no leídos
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count_user, 0)
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

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
        
        // Si hay un parámetro business en la URL, abrir automáticamente esa conversación
        if (businessIdParam && data) {
          const targetConversation = data.find(conv => conv.business_id === businessIdParam)
          if (targetConversation) {
            loadMessages(targetConversation)
            // Limpiar el parámetro de la URL
            router.replace('/app/dashboard/mis-mensajes', { scroll: false })
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessIdParam])

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

      // Actualizar la tabla conversations para persistir el contador en 0
      await supabase
        .from("conversations")
        .update({ 
          unread_count_user: 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversation.conversation_id)

      // Actualizar contador de no leídos en estado local
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
          
          // Variable para rastrear si es un mensaje nuevo (no optimista)
          let isNewMessageFromOther = false
          
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
            
            // Es un mensaje nuevo de otra persona
            if (newMsg.sender_id !== user.id) {
              isNewMessageFromOther = true
            }
            
            return [...prev, newMsg]
          })

          // 🔔 NOTIFICAR: Solo si es un mensaje nuevo de otra persona
          if (isNewMessageFromOther) {
            const senderName = selectedConversation?.business_name || 'Negocio'
            const preview = newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : '')
            notifyNewMessage(senderName, preview)
          }

          // Marcar como leído si no es nuestro mensaje
          if (newMsg.sender_id !== user.id) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
            
            // Actualizar el contador en la tabla conversations
            await supabase
              .from("conversations")
              .update({ unread_count_user: 0 })
              .eq("id", selectedConversation.conversation_id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation, user, notifyNewMessage])

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

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se abra la conversación
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta conversación? Todos los mensajes se eliminarán permanentemente.")) {
      return
    }

    try {
      // Eliminar la conversación (los mensajes se eliminan automáticamente por CASCADE)
      const { error: conversationError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user?.id) // Solo el dueño puede eliminar

      if (conversationError) {
        console.error("Error eliminando conversación:", conversationError)
        throw conversationError
      }

      // Actualizar estado local
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId))
      
      // Si la conversación eliminada era la seleccionada, deseleccionar
      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }

      setOpenMenuId(null)
    } catch (error: any) {
      console.error("Error eliminando conversación:", error)
      alert(`No se pudo eliminar la conversación: ${error.message || 'Error desconocido'}`)
    }
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
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Volver a lista de chats"
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
                <div
                  key={conv.conversation_id}
                  className={`relative w-full p-4 flex items-center gap-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 ${
                    selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gray-700/70' : ''
                  }`}
                >
                  <button
                    onClick={() => loadMessages(conv)}
                    className="absolute inset-0 w-full h-full"
                    aria-label={`Abrir conversación con ${conv.business_name}`}
                  />
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
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                      <span className="text-xs font-bold text-white">{conv.unread_count_user}</span>
                    </div>
                  )}
                  <div className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === conv.conversation_id ? null : conv.conversation_id)
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
                          onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
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
                    onClick={enableNotifications} // 🔔 Habilitar notificaciones al primer clic
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
