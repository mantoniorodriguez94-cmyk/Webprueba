// src/app/dashboard/negocios/[id]/mensajes/page.tsx
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import { useChatNotificationSound } from "@/hooks/useChatNotificationSound"

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
  
  // 🔊 Hook para notificaciones de sonido
  const { playSound, enableSound } = useChatNotificationSound()

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

      // Marcar mensajes como leídos
      await supabase.rpc("mark_conversation_as_read", {
        p_conversation_id: conversation.conversation_id,
        p_user_id: user!.id
      })

      // Actualizar contador local
      setConversations(prev =>
        prev.map(c =>
          c.conversation_id === conversation.conversation_id
            ? { ...c, unread_count_business: 0 }
            : c
        )
      )
    } catch (error) {
      console.error("Error cargando mensajes:", error)
    }
  }

  // Suscripción en tiempo real a mensajes de la conversación seleccionada
  useEffect(() => {
    if (!selectedConversation || !user) return

    // Suscribirse a nuevos mensajes en esta conversación
    const messagesChannel = supabase
      .channel(`business_messages_${selectedConversation.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.conversation_id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          
          // Evitar duplicados
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })

          // 🔊 REPRODUCIR SONIDO: Solo si el mensaje NO es del dueño del negocio
          if (newMessage.sender_id !== user.id) {
            playSound()
            
            // Marcar como leído
            supabase.rpc("mark_conversation_as_read", {
              p_conversation_id: selectedConversation.conversation_id,
              p_user_id: user.id
            })
          }

          // Actualizar la última mensaje en la lista de conversaciones
          setConversations(prev =>
            prev.map(c =>
              c.conversation_id === selectedConversation.conversation_id
                ? {
                    ...c,
                    last_message: newMessage.content,
                    last_message_at: newMessage.created_at,
                    last_message_sender_id: newMessage.sender_id,
                    unread_count_business: newMessage.sender_id === user.id ? 0 : c.unread_count_business
                  }
                : c
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation, user])

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

  // Enviar mensaje con UI optimista
  const handleSendMessage = async () => {
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
          content: messageContent
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
    } catch (error: any) {
      console.error("Error enviando mensaje:", error)
      
      // 4. Marcar mensaje como error en caso de fallo
      setMessages(prev =>
        prev.map(m =>
          m.tempId === tempId
            ? { ...m, status: 'error' as const }
            : m
        )
      )
      
      alert("⚠️ No se pudo enviar el mensaje. Por favor, intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (!business) return null

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count_business, 0)

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-sm sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-300 flex items-center gap-2">
                  <svg className="w-7 h-7 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mensajes
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {business.name} • {conversations.length} conversaciones
                  {totalUnread > 0 && ` • ${totalUnread} sin leer`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 overflow-hidden" style={{ height: "calc(100vh - 240px)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            
            {/* Lista de Conversaciones */}
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-900">Conversaciones</h3>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No hay mensajes aún</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Los usuarios pueden enviarte mensajes desde tu negocio
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      className={`relative w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.conversation_id === conv.conversation_id ? "bg-[#E3F2FD]" : ""
                      }`}
                    >
                      <button
                        onClick={() => loadMessages(conv)}
                        className="absolute inset-0 w-full h-full"
                        aria-label={`Abrir conversación con ${conv.user_name || conv.user_email}`}
                      />
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.user_name?.[0] || conv.user_email[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {conv.user_name || conv.user_email}
                            </h4>
                            {conv.unread_count_business > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full relative z-10">
                                {conv.unread_count_business}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conv.last_message_at).toLocaleString('es-ES', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === conv.conversation_id ? null : conv.conversation_id)
                            }}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            aria-label="Opciones"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {openMenuId === conv.conversation_id && (
                            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                              <button
                                onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Área de Chat */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header del chat */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-full flex items-center justify-center text-white font-bold">
                        {selectedConversation.user_name?.[0] || selectedConversation.user_email[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedConversation.user_name || selectedConversation.user_email}
                        </h4>
                        <p className="text-xs text-gray-500">{selectedConversation.user_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id
                      return (
                        <div key={msg.tempId || msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 transition-opacity ${
                              msg.status === 'sending' ? 'opacity-70' : 'opacity-100'
                            } ${
                              isOwn
                                ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}>
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
                              {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de mensaje */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onClick={enableSound} // 🔊 Habilitar sonido en Safari al primer clic
                        onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                        placeholder="Escribe tu respuesta..."
                        disabled={sending}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/20 outline-none transition-all disabled:bg-gray-100 text-gray-900 bg-white placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white rounded-2xl hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-600 font-medium text-lg">
                      Selecciona una conversación
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Elige un contacto para ver los mensajes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

