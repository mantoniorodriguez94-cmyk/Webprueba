/**
 * 🔔 Hook Completo para Notificaciones de Chat
 * 
 * Incluye:
 * - 🔊 Sonido de notificación
 * - 📱 Notificaciones del navegador
 * - 👁️ Notificación visual en pantalla
 * 
 * USO:
 * const { notifyNewMessage, enableNotifications } = useChatNotifications()
 * 
 * // Habilitar (debe hacerse en un onClick)
 * <input onClick={enableNotifications} />
 * 
 * // Notificar mensaje nuevo
 * notifyNewMessage(senderName, messageContent)
 */

import { useEffect, useRef, useState, useCallback } from "react"

export function useChatNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Pre-cargar el audio
    try {
      audioRef.current = new Audio("/sounds/notification.mp3")
      audioRef.current.volume = 0.8
      audioRef.current.preload = "auto"
      
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Audio de notificación cargado')
      })
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('❌ Error cargando audio:', e)
      })
      
    } catch (error) {
      console.error('❌ Error inicializando audio:', error)
    }
    
    // Verificar permisos de notificación
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Reproduce el sonido de notificación
   */
  const playSound = useCallback(async () => {
    if (!audioRef.current) return
    
    try {
      audioRef.current.currentTime = 0
      await audioRef.current.play()
      console.log('🔊 Sonido reproducido')
    } catch (error: any) {
      console.warn('⚠️ No se pudo reproducir sonido:', error.message)
    }
  }, [])

  /**
   * Muestra notificación del navegador
   */
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/assets/logotipo.png',
          badge: '/assets/logotipo.png',
          tag: 'chat-message',
          requireInteraction: false,
          silent: false
        })
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000)
        
        console.log('📱 Notificación del navegador mostrada')
      } catch (error) {
        console.warn('⚠️ Error mostrando notificación:', error)
      }
    }
  }, [])

  /**
   * Habilita sonido y solicita permisos de notificación
   * DEBE llamarse desde un evento de usuario (onClick)
   */
  const enableNotifications = useCallback(async () => {
    // 1. Habilitar audio (para Safari)
    if (audioRef.current) {
      try {
        audioRef.current.volume = 0.001
        await audioRef.current.play()
        
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.volume = 0.8
          setIsAudioEnabled(true)
          console.log('✅ Audio desbloqueado')
        }
      } catch (error) {
        console.warn('⚠️ Error desbloqueando audio:', error)
      }
    }
    
    // 2. Solicitar permisos de notificación del navegador
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission()
          setNotificationPermission(permission)
          
          if (permission === 'granted') {
            console.log('✅ Permisos de notificación concedidos')
            
            // Mostrar notificación de prueba
            new Notification('Notificaciones activadas', {
              body: 'Recibirás notificaciones de nuevos mensajes',
              icon: '/assets/logotipo.png',
              tag: 'welcome'
            })
          }
        } catch (error) {
          console.warn('⚠️ Error solicitando permisos:', error)
        }
      }
    }
  }, [])

  /**
   * Función principal: notificar nuevo mensaje
   * Reproduce sonido Y muestra notificación del navegador
   */
  const notifyNewMessage = useCallback((senderName: string, messagePreview: string) => {
    console.log('🔔 Notificando nuevo mensaje de:', senderName)
    
    // 1. Reproducir sonido
    playSound()
    
    // 2. Mostrar notificación del navegador (si está permitido)
    showBrowserNotification(
      `Nuevo mensaje de ${senderName}`,
      messagePreview
    )
    
    // 3. Vibración en móviles (si está disponible)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }, [playSound, showBrowserNotification])

  return { 
    notifyNewMessage,
    playSound, 
    enableNotifications,
    isAudioEnabled,
    notificationPermission
  }
}

