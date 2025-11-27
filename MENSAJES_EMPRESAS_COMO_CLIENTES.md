# 💼 Mensajes para Empresas que También Son Clientes

## ✅ Problema Resuelto

**Problema anterior:**
Cuando eres dueño de negocio y envías mensajes a otros negocios (actuando como cliente), esos chats NO aparecían en ninguna parte accesible.

**Solución implementada:**
Ahora los usuarios empresa tienen acceso a **DOS salas de chat separadas**:

1. 🏢 **Mensajes del Negocio** - Clientes que te escriben
2. 💬 **Mensajes como Cliente** - Negocios que tú contactaste

---

## 📂 Archivos Modificados

### 1. `src/app/app/dashboard/page.tsx`
**Menú de usuario en el Dashboard**

**Antes:**
- Usuarios empresa solo veían "Mis Mensajes" → mensajes del negocio
- NO tenían acceso a mensajes enviados como cliente

**Después:**
- 🏢 "Mensajes del Negocio" (icono azul 🏪) → `/app/dashboard/negocios/[id]/mensajes`
  - Clientes que te escribieron
  - Contador de no leídos del negocio
  
- 💬 "Mensajes como Cliente" (icono verde 💬) → `/app/dashboard/mis-mensajes`
  - Negocios que tú contactaste
  - Contador de no leídos personales

### 2. `src/app/app/dashboard/perfil/page.tsx`
**Página de perfil**

**Antes:**
- Usuarios empresa solo veían "Mensajes" → mensajes del negocio

**Después:**
- 🏢 "Mensajes del Negocio" → Consultas de clientes
- 💬 "Mensajes como Cliente" → Negocios que contactaste

---

## 🎯 Cómo Funciona Ahora

### Para Usuarios Persona (No empresas)
**Sin cambios** - Siguen viendo solo "Mis Mensajes"

### Para Usuarios Empresa
Ahora ven **3 opciones** en su menú:

```
┌─────────────────────────────────────┐
│  🏪 Mensajes del Negocio            │
│     Clientes que te escriben        │
│     [3 sin leer]                    │
├─────────────────────────────────────┤
│  💬 Mensajes como Cliente           │
│     Negocios que contactaste        │
│     [1 sin leer]                    │
├─────────────────────────────────────┤
│  🏢 Mis Negocios                    │
│     Ver y gestionar tus negocios    │
└─────────────────────────────────────┘
```

---

## 📊 Estructura de Datos

Las conversaciones se almacenan con:
- `business_id`: Negocio receptor del mensaje
- `user_id`: Usuario que inicia la conversación

### Ejemplo Real:

**Juan es dueño de "Cafetería Aroma" Y también cliente de "Restaurante Mar"**

#### Conversación 1: Cliente → Cafetería Aroma
```
business_id: cafeteria-aroma-id
user_id: maria-id
```
- María envía mensaje a Cafetería Aroma
- Juan (dueño) ve esto en **"Mensajes del Negocio"**

#### Conversación 2: Juan → Restaurante Mar
```
business_id: restaurante-mar-id
user_id: juan-id
```
- Juan (como cliente) envía mensaje a Restaurante Mar
- Juan ve esto en **"Mensajes como Cliente"**

---

## 🔍 Vistas Separadas

### Vista 1: Mensajes del Negocio
**Ruta:** `/app/dashboard/negocios/[id]/mensajes`

**Filtro:** `business_id = tu_negocio_id`

**Muestra:**
- Clientes que escribieron a TU negocio
- Tú respondes como dueño
- Avatar: Inicial del cliente
- Contador: `unread_count_business`

### Vista 2: Mensajes como Cliente  
**Ruta:** `/app/dashboard/mis-mensajes`

**Filtro:** `user_id = tu_user_id`

**Muestra:**
- Negocios a los que TÚ escribiste
- Tú envías como cliente
- Avatar: Logo del negocio
- Contador: `unread_count_user`

---

## 🎨 Diferencias Visuales

| Característica | Mensajes del Negocio | Mensajes como Cliente |
|----------------|---------------------|---------------------|
| **Icono** | 🏪 Edificio azul | 💬 Chat verde |
| **Color tema** | Azul (#0288D1) | Verde (#10B981) |
| **Avatar** | Inicial del cliente | Logo del negocio |
| **Descripción** | "Consultas de clientes" | "Negocios que contactaste" |
| **Rol** | Tú eres el negocio | Tú eres el cliente |

---

## ✅ Ventajas de Esta Separación

1. **Claridad de Roles**
   - Siempre sabes si estás actuando como negocio o como cliente
   
2. **Organización**
   - No se mezclan diferentes tipos de conversaciones
   
3. **Contadores Precisos**
   - Sabes cuántos mensajes de clientes tienes
   - Sabes cuántos negocios te respondieron

4. **UX Mejorada**
   - Contexto claro en cada vista
   - Iconos diferenciados
   - Descripciones específicas

5. **Escalabilidad**
   - Si tienes múltiples negocios, cada uno tiene sus mensajes
   - Tus mensajes como cliente están separados

---

## 🧪 Cómo Probar

### Escenario 1: Como Dueño de Negocio
1. Inicia sesión como usuario empresa
2. Abre el menú de usuario (arriba derecha)
3. Verás:
   - 🏪 "Mensajes del Negocio"
   - 💬 "Mensajes como Cliente"

4. Haz clic en "Mensajes del Negocio"
   - Verás clientes que te escribieron

5. Regresa y haz clic en "Mensajes como Cliente"
   - Verás negocios que tú contactaste

### Escenario 2: Enviar Mensaje a Otro Negocio
1. Como usuario empresa, navega el dashboard
2. Encuentra un negocio que te interese
3. Haz clic en "Enviar Mensaje"
4. Envía el mensaje
5. El chat aparecerá en **"Mensajes como Cliente"**
6. NO aparecerá en "Mensajes del Negocio"

### Escenario 3: Recibir Mensaje en Tu Negocio
1. Un cliente te envía mensaje a tu negocio
2. El chat aparece en **"Mensajes del Negocio"**
3. NO aparece en "Mensajes como Cliente"

---

## 🔧 Configuración Técnica

### Base de Datos
**Sin cambios** - La estructura actual ya soporta esto:

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL,  -- Negocio receptor
  user_id UUID NOT NULL,      -- Usuario que inicia
  ...
);
```

### Políticas RLS
**Sin cambios** - Ya permiten:
- Ver conversaciones donde eres `user_id` (como cliente)
- Ver conversaciones donde tu negocio es `business_id` (como dueño)

### Realtime
**Sin cambios** - Ambas vistas usan Supabase Realtime

---

## 📱 Navegación Actualizada

### Menú de Usuario (Dashboard)

**Para Usuario Persona:**
```
┌─────────────────────────────────┐
│  💬 Mis Mensajes                │
│     Ver conversaciones          │
└─────────────────────────────────┘
```

**Para Usuario Empresa (1 negocio):**
```
┌─────────────────────────────────┐
│  🏪 Mensajes del Negocio        │
│     Clientes que te escriben    │
├─────────────────────────────────┤
│  💬 Mensajes como Cliente       │
│     Negocios que contactaste    │
├─────────────────────────────────┤
│  🏢 Mis Negocios                │
└─────────────────────────────────┘
```

**Para Usuario Empresa (múltiples negocios):**
```
┌─────────────────────────────────┐
│  🏪 Mensajes del Negocio        │
│     Selecciona un negocio       │
├─────────────────────────────────┤
│  💬 Mensajes como Cliente       │
│     Negocios que contactaste    │
├─────────────────────────────────┤
│  🏢 Mis Negocios                │
└─────────────────────────────────┘
```

---

## 🎉 Resultado Final

Ahora cuando eres dueño de negocio Y también envías mensajes a otros negocios:

✅ **Ves TODOS tus chats:**
- Clientes que te contactaron (como negocio)
- Negocios que tú contactaste (como cliente)

✅ **Navegación clara:**
- Iconos diferentes para cada tipo
- Descripciones específicas
- Contadores separados

✅ **Sin mezclas:**
- Cada vista tiene su propósito
- No hay confusión de roles

✅ **Totalmente funcional:**
- Realtime en ambas vistas
- Notificaciones de sonido
- Contadores precisos
- Eliminar chats

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/app/app/dashboard/page.tsx` | Separación de menús para empresas | 680-754 |
| `src/app/app/dashboard/perfil/page.tsx` | Nuevo link "Mensajes como Cliente" | 291-320 |

**Total de archivos modificados:** 2
**Total de líneas modificadas:** ~100
**Sin errores de lint:** ✅
**Compatible con código existente:** ✅

---

**🎊 ¡Problema resuelto! Ahora todos tus chats son accesibles. 🎊**

