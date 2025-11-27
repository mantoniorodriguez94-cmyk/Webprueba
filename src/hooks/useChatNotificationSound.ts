/**
 * 🔊 Hook para manejar notificaciones de sonido en el chat
 * 
 * REPRODUCE SONIDO cuando llega un mensaje nuevo que:
 * ✅ NO fue enviado por el usuario actual
 * ✅ NO es un duplicado
 * ✅ NO es un mensaje optimista propio
 * 
 * NO REPRODUCE SONIDO cuando:
 * ❌ El usuario envía su propio mensaje
 * ❌ Llega un mensaje duplicado
 * ❌ El audio aún no ha sido desbloqueado en Safari
 * 
 * COMPATIBILIDAD:
 * - Chrome ✅
 * - Firefox ✅
 * - Safari ✅ (requiere enableSound() al primer clic)
 * - Edge ✅
 * - iOS Safari ✅
 * 
 * ARCHIVO REQUERIDO:
 * /public/sounds/notification.mp3
 * 
 * USO:
 * const { playSound, enableSound } = useChatNotificationSound()
 * 
 * // Desbloquear audio en Safari (en un onClick)
 * <input onClick={enableSound} />
 * 
 * // Reproducir sonido cuando llega mensaje
 * if (message.sender_id !== currentUser.id) {
 *   playSound()
 * }
 */

import { useEffect, useRef } from "react"

export function useChatNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Pre-cargar el audio
    audioRef.current = new Audio("/sounds/notification.mp3")
    audioRef.current.volume = 0.7
    
    // Cleanup al desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Reproduce el sonido de notificación
   * Maneja errores silenciosamente para evitar romper el flujo
   */
  const playSound = () => {
    if (!audioRef.current) return
    
    // Reiniciar el audio para permitir reproducción consecutiva
    audioRef.current.currentTime = 0
    
    // Reproducir y capturar errores
    audioRef.current.play().catch(() => {
      // Error silencioso - puede ser autoplay bloqueado en Safari
    })
  }

  /**
   * Habilita el sonido en Safari/iPhone
   * DEBE ser llamado desde un evento de click real del usuario
   * 
   * Safari bloquea autoplay hasta que el usuario interactúe
   * Esta función "desbloquea" el audio reproduciendo y pausando
   * un sonido silencioso
   */
  const enableSound = () => {
    if (!audioRef.current) return
    
    // Reproducir con volumen muy bajo
    audioRef.current.volume = 0.001
    audioRef.current.play()
      .then(() => {
        // Pausar inmediatamente y restaurar volumen
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.volume = 0.7
        }
      })
      .catch(() => {
        // Error al habilitar - no hacer nada
      })
  }

  return { playSound, enableSound }
}

