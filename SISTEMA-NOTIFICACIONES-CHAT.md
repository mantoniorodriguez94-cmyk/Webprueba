# 🔔 Sistema de Notificaciones de Chat - Documentación

## 📋 RESUMEN

Se ha implementado un sistema completo de notificaciones para los chats que incluye:

1. 🔊 **Sonido de Notificación** - Audio cuando llega un mensaje
2. 📱 **Notificaciones del Navegador** - Notificaciones de escritorio
3. 📳 **Vibración** - En dispositivos móviles compatibles
4. 🐛 **Debugging Completo** - Logs detallados en consola

---

## 🎯 CARACTERÍSTICAS

### ✅ Qué Notifica

- ✓ Mensajes recibidos de otros usuarios
- ✓ Mensajes en tiempo real (vía Supabase Realtime)
- ✓ Mensajes en conversaciones activas
- ✓ Mensajes no leídos

### ❌ Qué NO Notifica

- ✗ Tus propios mensajes
- ✗ Mensajes duplicados
- ✗ Mensajes ya leídos

---

## 🚀 CÓMO FUNCIONA

### Activación Automática

Las notificaciones se activan cuando el usuario **hace clic en el input de mensaje** por primera vez.

Esto es necesario porque:
- Safari y navegadores móviles bloquean audio automático
- Las notificaciones del navegador requieren permiso explícito

### Proceso de Activación

1. **Usuario hace clic** en el campo de texto del chat
2. Se **solicitan permisos** de notificación del navegador
3. Se **desbloquea audio** para Safari/iOS
4. Se muestra **notificación de confirmación**
5. El sistema queda **activo permanentemente**

---

## 🔊 COMPONENTES DEL SISTEMA

### 1. Hook: `useChatNotifications`

Ubicación: `src/hooks/useChatNotifications.ts`

```typescript
const { 
  notifyNewMessage,      // Función principal
  playSound,             // Solo sonido
  enableNotifications,   // Activar permisos
  isAudioEnabled,        // Estado del audio
  notificationPermission // Estado de permisos
} = useChatNotifications()
```

#### Uso:

```typescript
// Habilitar al hacer clic (requerido una vez)
<input onClick={enableNotifications} />

// Notificar mensaje nuevo
notifyNewMessage('Juan Pérez', 'Hola, ¿cómo estás?')
```

### 2. Archivo de Sonido

**Ubicación:** `/public/sounds/notification.mp3`

- Tamaño: ~45KB
- Formato: MP3
- Volumen: 80%
- Duración: Corta (ideal para notificaciones)

### 3. Implementación en Chats

**Chat de Usuarios:** `src/app/app/dashboard/mis-mensajes/page.tsx`

```typescript
const { notifyNewMessage, enableNotifications } = useChatNotifications()

// En el listener de mensajes
if (isNewMessageFromOther) {
  const senderName = selectedConversation?.business_name || 'Negocio'
  const preview = newMsg.content.substring(0, 50) + '...'
  notifyNewMessage(senderName, preview)
}
```

**Chat de Negocios:** `src/app/app/dashboard/negocios/[id]/mensajes/page.tsx`

```typescript
const { notifyNewMessage, enableNotifications } = useChatNotifications()

// En el listener de mensajes
if (isNewMessageFromOther) {
  const senderName = newMsg.sender_name || 'Usuario'
  const preview = newMsg.content.substring(0, 50) + '...'
  notifyNewMessage(senderName, preview)
}
```

---

## 🐛 DEBUGGING Y LOGS

El sistema incluye logs detallados para facilitar el debugging:

### Logs de Inicialización

```
🔊 Audio de notificación cargado
✅ Audio desbloqueado
✅ Permisos de notificación concedidos
```

### Logs de Notificación

```
🔔 Notificando nuevo mensaje de: Juan Pérez
🔊 Sonido reproducido
📱 Notificación del navegador mostrada
```

### Logs de Error

```
⚠️ No se pudo reproducir sonido: NotAllowedError
💡 Solución: El usuario debe hacer clic en el input
⚠️ Error cargando audio: [detalles del error]
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: No suena el audio

**Causa:** Safari/iOS bloquea autoplay

**Solución:**
1. Abre la consola (F12)
2. Busca: `⚠️ NotAllowedError`
3. Haz clic en el input de mensaje
4. Verifica log: `✅ Audio desbloqueado`

### Problema: No aparecen notificaciones del navegador

**Causa:** Permisos no concedidos

**Solución:**
1. Ve a configuración del navegador
2. Busca permisos del sitio
3. Permite notificaciones para `localhost` o tu dominio
4. Recarga la página
5. Haz clic en el input de mensaje

### Problema: Aparece error de carga de audio

**Causa:** Archivo no encontrado o corrupto

**Solución:**
1. Verifica que existe: `public/sounds/notification.mp3`
2. Tamaño debe ser ~45KB
3. Intenta reproducir manualmente en el navegador
4. Si falla, reemplaza el archivo

---

## 📱 COMPATIBILIDAD

| Navegador | Sonido | Notificaciones | Vibración |
|-----------|--------|----------------|-----------|
| Chrome Desktop | ✅ | ✅ | ❌ |
| Firefox Desktop | ✅ | ✅ | ❌ |
| Safari Desktop | ✅* | ✅ | ❌ |
| Edge Desktop | ✅ | ✅ | ❌ |
| Chrome Mobile | ✅* | ✅ | ✅ |
| Safari iOS | ✅* | ⚠️** | ✅ |
| Firefox Mobile | ✅* | ✅ | ✅ |

**\*** Requiere interacción del usuario primero (clic en input)

**\*\*** iOS Safari no soporta Web Notifications API, pero sí sonido y vibración

---

## ✨ PRÓXIMAS MEJORAS

### En Consideración

- [ ] Badge de contador en el ícono de la pestaña
- [ ] Diferentes sonidos para diferentes tipos de mensajes
- [ ] Configuración de usuario para activar/desactivar
- [ ] Volumen ajustable
- [ ] No molestar automático (horarios)
- [ ] Notificaciones agrupadas
- [ ] Prioridad de notificaciones

### Implementadas

- [x] Sonido de notificación
- [x] Notificaciones del navegador
- [x] Vibración móvil
- [x] Debugging completo
- [x] Manejo de errores
- [x] Compatibilidad Safari
- [x] Activación con un clic

---

## 🧪 TESTING

### Test Manual

1. **Abrir dos navegadores**
   - Navegador A: Usuario 1
   - Navegador B: Usuario 2

2. **En Navegador A:**
   - Abre un chat
   - Haz clic en el input (activar notificaciones)
   - Espera mensaje

3. **En Navegador B:**
   - Envía un mensaje al Usuario 1

4. **Verificar en Navegador A:**
   - ✓ Debe sonar audio
   - ✓ Debe aparecer notificación del navegador
   - ✓ Debe vibrar (móvil)
   - ✓ Debe aparecer log: `🔔 Notificando nuevo mensaje`

### Test de Debugging

1. Abre la consola (F12)
2. Busca los logs con emojis: 🔊 🔔 📱
3. Verifica que no haya ⚠️ warnings
4. Si hay warnings, sigue las soluciones indicadas

---

## 📞 SOPORTE

Si encuentras problemas:

1. Abre consola del navegador (F12)
2. Reproduce el error
3. Copia los logs que empiecen con 🔊 🔔 ⚠️
4. Reporta con esos logs

---

**Última actualización:** Nov 30, 2025

**Versión:** 2.0.0

**Estado:** ✅ Funcional y Testeado

