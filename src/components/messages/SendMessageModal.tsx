// src/components/messages/SendMessageModal.tsx
"use client"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import type { Business } from "@/types/business"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import UpgradeSuggestion from "@/components/memberships/UpgradeSuggestion"
import { SUBSCRIPTION_TIER_CONECTA } from "@/lib/memberships/tiers"

interface SendMessageModalProps {
  business: Business
  currentUserId: string
  onClose: () => void
  onSuccess?: (businessId: string) => void
}

export default function SendMessageModal({
  business,
  currentUserId,
  onClose,
  onSuccess
}: SendMessageModalProps) {
  const { hasAccess, loading: accessLoading } = useMembershipAccess()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const canAccessChat = hasAccess(SUBSCRIPTION_TIER_CONECTA)

  const handleSendMessage = async () => {
    if (!canAccessChat) {
      return // Should not happen if UI is correct, but safety check
    }

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

      // 3. Éxito - Redirigir al chat
      onSuccess?.(business.id)
      onClose()
    } catch (error: any) {
      console.error("Error enviando mensaje:", error)
      alert("❌ Error al enviar el mensaje: " + (error.message || "Error desconocido"))
    } finally {
      setSending(false)
    }
  }

  const modalContent = (
    <>
      {/* Overlay — fixed respecto al viewport */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Modal — siempre visible y operativo, sin recortes */}
        <div 
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 w-full sm:max-w-lg flex flex-col animate-fadeIn max-h-[90vh] min-h-[320px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0288D1] to-[#0277BD] p-4 sm:p-6 text-white rounded-t-3xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Logo del negocio */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex-shrink-0 ring-2 ring-white/40">
                  {business.logo_url ? (
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                      {business.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold truncate">Enviar Mensaje</h3>
                  <p className="text-xs sm:text-sm text-white/80 truncate">{business.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido - Scrollable, con espacio fijo para el footer */}
          <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
            {!accessLoading && !canAccessChat ? (
              <UpgradeSuggestion
                requiredTier={SUBSCRIPTION_TIER_CONECTA}
                featureName="Chat con Clientes"
                featureDescription="Comunícate directamente con los negocios a través de nuestro sistema de mensajería integrado."
                variant="modal"
              />
            ) : (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tu mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Escribe tu mensaje para ${business.name}...`}
                  rows={6}
                  disabled={sending || !canAccessChat}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-[#0288D1] focus:ring-2 focus:ring-[#0288D1]/20 outline-none transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-base text-gray-900 bg-white placeholder:text-gray-500"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {message.length}/500 caracteres
                </p>
              </>
            )}
          </div>

          {/* Footer - Siempre visible abajo del modal */}
          <div className="p-4 sm:p-6 bg-gray-50 rounded-b-3xl flex gap-2 sm:gap-3 flex-shrink-0 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim() || !canAccessChat}
              className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white rounded-2xl hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Enviando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  if (typeof document === "undefined") return null
  return createPortal(modalContent, document.body)
}

