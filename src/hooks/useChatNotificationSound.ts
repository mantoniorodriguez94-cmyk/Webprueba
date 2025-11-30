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

import { useEffect, useRef, useState } from "react"

export function useChatNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Pre-cargar el audio
    try {
      audioRef.current = new Audio("/sounds/notification.mp3")
      audioRef.current.volume = 0.8
      audioRef.current.preload = "auto"
      
      // Detectar si el audio se carga correctamente
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Audio de notificación cargado correctamente')
      })
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('❌ Error cargando audio de notificación:', e)
        setHasError(true)
      })
      
    } catch (error) {
      console.error('❌ Error inicializando audio:', error)
      setHasError(true)
    }
    
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
   * Maneja errores y proporciona debugging
   */
  const playSound = async () => {
    if (!audioRef.current) {
      console.warn('⚠️ Audio ref no disponible')
      return
    }
    
    if (hasError) {
      console.warn('⚠️ Audio tiene error, no se puede reproducir')
      return
    }
    
    try {
      // Reiniciar el audio para permitir reproducción consecutiva
      audioRef.current.currentTime = 0
      
      console.log('🔊 Intentando reproducir sonido de notificación...')
      
      // Reproducir el audio
      await audioRef.current.play()
      
      console.log('✅ Sonido reproducido exitosamente')
    } catch (error: any) {
      console.warn('⚠️ Error reproduciendo sonido:', error.message)
      
      // Si falla por autoplay, sugerir habilitar sonido
      if (error.name === 'NotAllowedError') {
        console.warn('💡 Solución: El usuario debe hacer clic en el input para habilitar sonido (Safari/iOS)')
      }
    }
  }

  /**
   * Habilita el sonido en Safari/iPhone
   * DEBE ser llamado desde un evento de click real del usuario
   * 
   * Safari bloquea autoplay hasta que el usuario interactúe
   * Esta función "desbloquea" el audio reproduciendo y pausando
   * un sonido silencioso
   */
  const enableSound = async () => {
    if (!audioRef.current) return
    
    try {
      // Reproducir con volumen muy bajo
      audioRef.current.volume = 0.001
      await audioRef.current.play()
      
      // Pausar inmediatamente y restaurar volumen
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.8
        setIsEnabled(true)
        console.log('✅ Audio desbloqueado para Safari/iOS')
      }
    } catch (error: any) {
      console.warn('⚠️ Error desbloqueando audio:', error.message)
    }
  }

  return { playSound, enableSound, isEnabled }
}

