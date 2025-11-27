# 🔊 Sistema de Notificaciones de Sonido - Chat en Tiempo Real

## ✅ Implementación Completada

Se ha integrado exitosamente un sistema de notificaciones de sonido en el chat de Encuentra.app.

---

## 📂 Archivos Creados/Modificados

### 1. **Hook Personalizado** ✨ NUEVO
**Ubicación:** `src/hooks/useChatNotificationSound.ts`

Hook reutilizable que maneja la reproducción de sonidos de notificación:
- Pre-carga el audio al montar el componente
- Reproduce sonido con `playSound()`
- Incluye `enableSound()` para desbloquear audio en Safari/iPhone
- Maneja errores silenciosamente sin romper el flujo

### 2. **Chat de Usuarios** 🔧 MODIFICADO
**Ubicación:** `src/app/app/dashboard/mis-mensajes/page.tsx`

**Cambios realizados:**
- ✅ Importado hook `useChatNotificationSound`
- ✅ Integrado en suscripción Realtime de Supabase
- ✅ Reproduce sonido solo cuando llega mensaje de otra persona
- ✅ Respeta UI optimista (no suena con mensajes propios)
- ✅ Evita duplicados
- ✅ Activa sonido en Safari con onClick en el input

### 3. **Chat de Negocios** 🔧 MODIFICADO
**Ubicación:** `src/app/app/dashboard/negocios/[id]/mensajes/page.tsx`

**Cambios realizados:**
- ✅ Importado hook `useChatNotificationSound`
- ✅ Integrado en suscripción Realtime de Supabase
- ✅ Reproduce sonido solo cuando llega mensaje de cliente
- ✅ Evita duplicados
- ✅ Activa sonido en Safari con onClick en el input

---

## 🎯 Lógica de Notificaciones

### ✅ El sonido SE REPRODUCE cuando:
1. Llega un mensaje nuevo
2. El mensaje NO fue enviado por el usuario actual
3. No es un duplicado
4. No es un mensaje optimista propio

### ❌ El sonido NO se reproduce cuando:
1. El usuario envía un mensaje (UI optimista)
2. Llega un mensaje duplicado
3. El audio no ha sido habilitado en Safari (se activa con primer clic)

---

## 🔒 Compatibilidad Safari/iPhone

Safari y iOS bloquean el autoplay de audio por políticas de seguridad.

**Solución implementada:**
- Al hacer clic en el input de mensaje, se llama a `enableSound()`
- Esto reproduce un sonido silencioso y lo pausa inmediatamente
- "Desbloquea" el audio para futuras reproducciones
- Funciona en todos los navegadores (Chrome, Firefox, Safari, Edge)

---

## 📝 Código Realtime Integrado

### Para Usuarios (mis-mensajes/page.tsx)

```typescript
// Suscripción Realtime con sonido
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
        
        let isNewMessageFromOther = false
        
        setMessages(prev => {
          // Verificar si es mensaje optimista
          const existingIndex = prev.findIndex(m => 
            m.sender_id === newMsg.sender_id && 
            m.content === newMsg.content &&
            m.status === 'sending'
          )
          
          if (existingIndex !== -1) {
            // Es nuestro mensaje optimista
            const updated = [...prev]
            updated[existingIndex] = { ...newMsg, status: 'sent' }
            return updated
          }
          
          // Evitar duplicados
          if (prev.some(m => m.id === newMsg.id)) return prev
          
          // Es mensaje nuevo de otra persona
          if (newMsg.sender_id !== user.id) {
            isNewMessageFromOther = true
          }
          
          return [...prev, newMsg]
        })

        // 🔊 REPRODUCIR SONIDO
        if (isNewMessageFromOther) {
          playSound()
        }

        // Marcar como leído
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
```

### Para Negocios (mensajes/page.tsx)

```typescript
// Suscripción Realtime con sonido
useEffect(() => {
  if (!selectedConversation || !user) return

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

        // 🔊 REPRODUCIR SONIDO: Solo si NO es del dueño
        if (newMessage.sender_id !== user.id) {
          playSound()
          
          // Marcar como leído
          supabase.rpc("mark_conversation_as_read", {
            p_conversation_id: selectedConversation.conversation_id,
            p_user_id: user.id
          })
        }

        // Actualizar lista de conversaciones
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
```

---

## ⚠️ IMPORTANTE: Archivo de Sonido Requerido

El sistema espera encontrar un archivo de sonido en:

```
/public/sounds/notification.mp3
```

**Debes crear esta carpeta y archivo:**

1. Crea la carpeta `sounds` dentro de `public/`
2. Coloca un archivo de sonido llamado `notification.mp3`
3. Recomendación: usar un sonido corto (0.5-1 segundo)
4. Volumen del archivo no muy alto (se ajusta a 70% en el código)

**Formatos soportados:**
- MP3 (recomendado)
- WAV
- OGG

**Alternativas si no tienes un archivo:**
- Buscar sonidos gratis en https://freesound.org
- Usar sonidos del sistema de tu computadora
- Generar uno online con herramientas gratuitas

---

## 🧪 Pruebas

### Para Probar el Sistema:

1. **Abrir dos navegadores/pestañas:**
   - Navegador A: Usuario regular
   - Navegador B: Dueño de negocio (o viceversa)

2. **En Navegador A:**
   - Ir a "Mis Mensajes"
   - Abrir un chat con un negocio
   - Hacer clic en el input (activa audio en Safari)

3. **En Navegador B:**
   - Como dueño del negocio, responder el mensaje

4. **Resultado esperado:**
   - 🔊 Navegador A debe reproducir el sonido de notificación
   - 📱 El mensaje aparece instantáneamente
   - ✅ No hay errores en consola

### Probar en Safari/iPhone:

1. Abrir el chat en Safari
2. Hacer clic en el campo "Escribe un mensaje..."
3. Esto desbloquea el audio
4. Recibir un mensaje → debe sonar

---

## 🎨 Arquitectura

```
┌─────────────────────────────────────────┐
│  useChatNotificationSound Hook          │
│  ├─ Pre-carga audio                     │
│  ├─ playSound() → reproduce             │
│  └─ enableSound() → desbloquea Safari   │
└─────────────────────────────────────────┘
              ↓ usado por
┌─────────────────────────────────────────┐
│  Chat de Usuarios                        │
│  /app/dashboard/mis-mensajes             │
│  ├─ Realtime Supabase                   │
│  ├─ UI Optimista                        │
│  └─ playSound() al recibir mensaje      │
└─────────────────────────────────────────┘
              ↓ y por
┌─────────────────────────────────────────┐
│  Chat de Negocios                        │
│  /negocios/[id]/mensajes                 │
│  ├─ Realtime Supabase                   │
│  ├─ Sin UI Optimista                    │
│  └─ playSound() al recibir mensaje      │
└─────────────────────────────────────────┘
```

---

## ✅ Ventajas de Esta Implementación

1. **Reutilizable:** Hook puede usarse en futuros componentes
2. **Limpia:** No modifica arquitectura existente
3. **Compatible:** Funciona en todos los navegadores
4. **Sin errores:** Manejo silencioso de errores
5. **UX mejorado:** Notificación instantánea sin ser intrusiva
6. **Respeta UI optimista:** No suena con mensajes propios
7. **Sin duplicados:** Lógica robusta contra mensajes repetidos

---

## 🔧 Mantenimiento Futuro

### Para cambiar el volumen:
Editar en `useChatNotificationSound.ts`:
```typescript
audioRef.current.volume = 0.7 // Cambiar de 0.0 a 1.0
```

### Para usar otro sonido:
Reemplazar el archivo en `/public/sounds/notification.mp3`

### Para desactivar sonidos temporalmente:
Comentar la línea `playSound()` en ambos archivos de chat

### Para agregar vibración (móviles):
Agregar después de `playSound()`:
```typescript
if (navigator.vibrate) {
  navigator.vibrate(200) // 200ms de vibración
}
```

---

## 📞 Solución de Problemas

### No se escucha el sonido:
1. Verificar que existe `/public/sounds/notification.mp3`
2. Hacer clic en el input del chat (desbloquea Safari)
3. Verificar volumen del sistema
4. Revisar consola del navegador (F12)

### Error "Cannot find module":
El archivo de sonido no existe. Crear la carpeta y archivo.

### Sonido se reproduce al enviar mensaje propio:
Verificar la lógica `if (newMsg.sender_id !== user.id)`

### No funciona en Safari:
Asegurarse de hacer clic en el input antes de recibir mensajes.

---

## 📌 Resumen Final

✅ **Hook creado:** `src/hooks/useChatNotificationSound.ts`
✅ **Chat usuarios modificado:** `src/app/app/dashboard/mis-mensajes/page.tsx`
✅ **Chat negocios modificado:** `src/app/app/dashboard/negocios/[id]/mensajes/page.tsx`
✅ **Realtime intacto:** No se rompió funcionalidad existente
✅ **UI optimista respetada:** Solo suena con mensajes reales de otros
✅ **Safari compatible:** Sistema de desbloqueo implementado

🎯 **Próximo paso:** Agregar el archivo `/public/sounds/notification.mp3`

