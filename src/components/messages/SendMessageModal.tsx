// src/components/messages/SendMessageModal.tsx
"use client"
import React, { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Business } from "@/types/business"

interface SendMessageModalProps {
  business: Business
  currentUserId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function SendMessageModal({
  business,
  currentUserId,
  onClose,
  onSuccess
}: SendMessageModalProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Por favor escribe un mensaje")
      return
    }

    setSending(true)

    try {
      // 1. Buscar o crear conversación
      let conversationId: string

      const { data: existingConversation, error: searchError } = await supabase
        .from("conversations")
        .select("id")
        .eq("business_id", business.id)
        .eq("user_id", currentUserId)
        .single()

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        // Crear nueva conversación
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            business_id: business.id,
            user_id: currentUserId
          })
          .select("id")
          .single()

        if (createError) throw createError
        conversationId = newConversation.id
      }

      // 2. Enviar mensaje
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: message.trim()
        })

      if (messageError) throw messageError

      // 3. Éxito
      alert("✅ Mensaje enviado exitosamente")
      setMessage("")
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error enviando mensaje:", error)
      alert("❌ Error al enviar el mensaje: " + (error.message || "Error desconocido"))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 max-w-lg w-full animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] p-6 text-white rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo del negocio */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex-shrink-0 ring-2 ring-white/40">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {business.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Enviar Mensaje</h3>
                  <p className="text-sm text-white/80">{business.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tu mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Escribe tu mensaje para ${business.name}...`}
              rows={6}
              disabled={sending}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/20 outline-none transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              {message.length}/500 caracteres
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white rounded-2xl hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Mensaje
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

