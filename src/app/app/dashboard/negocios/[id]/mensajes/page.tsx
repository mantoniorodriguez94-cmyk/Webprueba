// src/app/dashboard/negocios/[id]/mensajes/page.tsx
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import type { Business } from "@/types/business"
import { useChatNotifications } from "@/hooks/useChatNotifications"
import BottomNav from "@/components/ui/BottomNav"

interface Conversation {
  conversation_id: string
  user_id: string
  user_name: string
  user_email: string
  last_message: string
  last_message_at: string
  last_message_sender_id: string
  unread_count_business: number
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

export default function MensajesNegocioPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const businessId = params?.id as string
  
  // 🔔 Hook para notificaciones completas (sonido + navegador)
  const { notifyNewMessage, enableNotifications } = useChatNotifications()

  // Auto-scroll al final de los mensajes
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

  // Cargar negocio y verificar permisos
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId || !user) return

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (error) throw error

        // Verificar que el usuario es el dueño
        if (data.owner_id !== user.id) {
          alert("No tienes permiso para ver los mensajes de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(data)
      } catch (error) {
        console.error("Error cargando negocio:", error)
        router.push("/app/dashboard")
      }
    }

    fetchBusiness()
  }, [businessId, user, router])

  // Cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      if (!businessId || !business) return

      try {
        const { data, error } = await supabase
          .from("conversation_details")
          .select("*")
          .eq("business_id", businessId)
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

    // Suscripción en tiempo real a cambios en conversaciones del negocio
    const conversationsChannel = supabase
      .channel('business_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          // Recargar conversaciones cuando hay cambios
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, business])

  // Cargar mensajes de una conversación
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

      // Marcar mensajes como leídos (MISMA LÓGICA que mis-mensajes)
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
          unread_count_business: 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversation.conversation_id)

      // Actualizar contador de no leídos en estado local
      setConversations(prev =>
        prev.map(conv =>
          conv.conversation_id === conversation.conversation_id
            ? { ...conv, unread_count_business: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error("Error cargando mensajes:", error)
    }
  }

  // Suscripción en tiempo real a mensajes de la conversación seleccionada (MISMA LÓGICA que mis-mensajes)
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
            // Obtener nombre del remitente de la conversación actual
            const senderName = selectedConversation.user_name || selectedConversation.user_email || 'Usuario'
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
              .update({ unread_count_business: 0 })
              .eq("id", selectedConversation.conversation_id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation, user, notifyNewMessage])

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se abra la conversación
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta conversación? Todos los mensajes se eliminarán permanentemente.")) {
      return
    }

    try {
      // Verificar que el negocio pertenece al usuario actual
      if (!business || business.owner_id !== user?.id) {
        alert("No tienes permiso para eliminar esta conversación")
        return
      }

      // Eliminar la conversación (los mensajes se eliminan automáticamente por CASCADE)
      const { error: conversationError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("business_id", businessId) // Solo el dueño del negocio puede eliminar

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

  // Enviar mensaje con UI optimista (MISMA LÓGICA que mis-mensajes)
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

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (!business) return null

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count_business, 0)
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  return (
    <div className="min-h-screen w-full flex flex-col pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Volver a lista de chats"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {!selectedConversation && (
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Volver atrás"
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
              {selectedConversation ? (selectedConversation.user_name || selectedConversation.user_email) : `${business.name} - Mensajes`}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Conversaciones */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 flex-col border-r border-white/10 bg-gray-900/50`}>
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
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sin mensajes</h3>
                <p className="text-sm text-white/50">Los usuarios pueden enviarte mensajes desde tu negocio</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto rounded">
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  className={`relative w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                    selectedConversation?.conversation_id === conv.conversation_id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <button
                    onClick={() => loadMessages(conv)}
                    className="absolute inset-0 w-full h-full"
                    aria-label={`Abrir conversación con ${conv.user_name || conv.user_email}`}
                  />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {conv.user_name?.[0]?.toUpperCase() || conv.user_email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{conv.user_name || conv.user_email}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(conv.last_message_at).toLocaleString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.last_message_sender_id === user?.id && "Tú: "}
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread_count_business > 0 && (
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                      <span className="text-xs font-bold text-white">{conv.unread_count_business}</span>
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
                      <div className="absolute right-0 mt-1 bg-white/10 border border-white/20 rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                        <button
                          onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
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
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gray-900/30`}>
          {selectedConversation ? (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id
                  return (
                    <div key={msg.tempId || msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] sm:max-w-md rounded-2xl px-4 py-2.5 transition-opacity ${
                        msg.status === 'sending' ? 'opacity-70' : 'opacity-100'
                      } ${
                        isOwn 
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20' 
                          : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-bl-sm'
                      }`}>
                        <p className="text-sm sm:text-base break-words">{msg.content}</p>
                        <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-blue-200' : 'text-white/50'}`}>
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
                          {isOwn && msg.status !== 'sending' && msg.status !== 'error' && (
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

              {/* Input - Separado del BottomNav */}
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
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Selecciona una conversación</h3>
                <p className="text-gray-400">Elige un usuario de la lista para ver tus mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>
        
      <BottomNav isCompany={isCompany} unreadCount={totalUnread} />
    

    </div>
  )
}

