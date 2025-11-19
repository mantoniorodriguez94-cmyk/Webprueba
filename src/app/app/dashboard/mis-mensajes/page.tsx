// src/app/dashboard/mis-mensajes/page.tsx
"use client"
import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"

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

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Cargar conversaciones del usuario
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

    // Suscripción en tiempo real a cambios en conversaciones
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
          // Recargar conversaciones cuando hay cambios
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
  }, [user])

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
            ? { ...c, unread_count_user: 0 }
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
      .channel(`messages_${selectedConversation.conversation_id}`)
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
          
          // Agregar el nuevo mensaje al chat
          setMessages(prev => [...prev, newMessage])

          // Si el mensaje NO es del usuario actual, marcarlo como leído automáticamente
          if (newMessage.sender_id !== user.id) {
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
                    unread_count_user: newMessage.sender_id === user.id ? 0 : c.unread_count_user
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

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("") // Limpiar input inmediatamente para mejor UX

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.conversation_id,
          sender_id: user.id,
          content: messageContent
        })

      if (error) throw error

      // El mensaje aparecerá automáticamente gracias a la suscripción en tiempo real
      // No es necesario agregarlo manualmente
    } catch (error: any) {
      console.error("Error enviando mensaje:", error)
      alert("Error al enviar el mensaje")
      // Restaurar el mensaje en caso de error
      setNewMessage(messageContent)
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h2>
          <Link 
            href="/app/auth/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    )
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count_user, 0)

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-[#0288D1]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/app/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver al dashboard"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-7 h-7 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mis Mensajes
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {conversations.length} conversaciones con negocios
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
                <p className="text-xs text-gray-500 mt-1">Tus chats con negocios</p>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No tienes mensajes aún</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Envía un mensaje a cualquier negocio para comenzar
                  </p>
                  <Link
                    href="/app/dashboard"
                    className="inline-flex items-center gap-2 mt-4 text-[#0288D1] hover:underline font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explorar Negocios
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => loadMessages(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.conversation_id === conv.conversation_id ? "bg-[#E3F2FD]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Logo del negocio */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-2 ring-white shadow-md">
                          {conv.business_logo ? (
                            <img
                              src={conv.business_logo}
                              alt={conv.business_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#0288D1] font-bold text-lg">
                              {conv.business_name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {conv.business_name}
                            </h4>
                            {conv.unread_count_user > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {conv.unread_count_user}
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
                      </div>
                    </button>
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
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0 ring-2 ring-white shadow-md">
                        {selectedConversation.business_logo ? (
                          <img
                            src={selectedConversation.business_logo}
                            alt={selectedConversation.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#0288D1] font-bold text-lg">
                            {selectedConversation.business_name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedConversation.business_name}
                        </h4>
                        <Link
                          href={`/app/dashboard`}
                          className="text-xs text-[#0288D1] hover:underline"
                        >
                          Ver negocio en el feed
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}>
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
                        onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                        placeholder="Escribe tu mensaje..."
                        disabled={sending}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/20 outline-none transition-all disabled:bg-gray-100"
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
                      Elige un negocio para ver los mensajes
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

