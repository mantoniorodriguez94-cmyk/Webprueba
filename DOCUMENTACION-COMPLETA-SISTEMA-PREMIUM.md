# 📚 Documentación Completa del Sistema Premium

## 🎯 Resumen Ejecutivo

Este documento consolida toda la información sobre el sistema de membresías premium implementado en la plataforma Encuentra, incluyendo el sistema de borde dorado, gestión de membresías por negocio, y notificaciones personalizadas.

---

## 📋 Índice

1. [Sistema de Membresías Premium](#sistema-de-membresías-premium)
2. [Sistema de Borde Dorado](#sistema-de-borde-dorado)
3. [Sistema de Notificaciones](#sistema-de-notificaciones)
4. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Guía de Implementación](#guía-de-implementación)

---

## 1. Sistema de Membresías Premium

### 🎯 Modelo de Negocio

**Membresía por Negocio Individual**
- Cada negocio tiene su propia membresía premium
- Los usuarios pueden tener múltiples negocios, cada uno con su propia suscripción
- Las membresías se gestionan desde la página de gestión de cada negocio

### 📊 Planes Disponibles

#### Plan Mensual
- **Precio:** Variable (configurado en `premium_plans`)
- **Duración:** 30 días
- **Límite de Borde Dorado:** 1 negocio
- **Renovación:** Manual

#### Plan Anual
- **Precio:** Variable (configurado en `premium_plans`)
- **Duración:** 365 días
- **Límite de Borde Dorado:** 2 negocios
- **Renovación:** Manual
- **Badge:** "⭐ AHORRA MÁS"

### 🔄 Extensión Automática de Días

Cuando un usuario renueva o cambia de plan, los días restantes de su membresía actual se suman automáticamente al nuevo período.

**Ejemplo:**
```
Membresía actual: 25 días restantes
Nueva suscripción: Plan Mensual (30 días)
Resultado: 25 + 30 = 55 días totales
```

### 📍 Ubicaciones Clave

#### Card de Membresía en Gestionar Negocio
**Ruta:** `/app/dashboard/negocios/[id]/gestionar`

**Estado Premium Activo:**
```
┌─────────────────────────────────────────┐
│  ⭐ Membresía Premium [ACTIVA]          │
│     ✅ Este negocio es Premium          │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ 📅 Expira│  │ ⏱️ Días  │           │
│  │ 21 abr   │  │ 118 días │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  [🔄 Renovar] [💎 Cambiar Plan]       │
└─────────────────────────────────────────┘
```

#### Página de Membresía Premium
**Ruta:** `/app/dashboard/negocios/[id]/membresia-premium`

**Parámetros URL:**
- `?action=renew` - Renovar plan actual
- `?action=change` - Cambiar a otro plan

---

## 2. Sistema de Borde Dorado

### 🌟 Concepto

El "borde dorado" es una característica premium visual que hace que un negocio destaque en el feed principal del dashboard.

### 📏 Límites por Tipo de Membresía

| Membresía | Límite de Bordes Dorados |
|-----------|--------------------------|
| Mensual   | 1 negocio                |
| Anual     | 2 negocios               |

### 🎮 Control del Borde Dorado

#### Ubicación del Botón
**Ruta:** `/app/dashboard/negocios/[id]/gestionar`

El botón aparece al lado del badge "PREMIUM" en la información del negocio.

#### Estados del Botón

**1. Borde Activo**
```
[✨ Borde Activo]
```
- Color: Gradiente dorado
- Acción: Click para desactivar

**2. Disponible para Activar**
```
[✨ Activar Borde]
```
- Color: Amber semitransparente
- Acción: Click para activar

**3. Límite Alcanzado**
```
[✨ Límite (1/1)]
```
- Color: Gris
- Estado: Deshabilitado
- Tooltip: "Límite alcanzado. Desactiva el borde en otro negocio primero."

### 🔧 Implementación Técnica

#### Base de Datos
**Tabla:** `businesses`
**Campo:** `golden_border_active` (boolean, default: false)

#### API Route
**Endpoint:** `/api/businesses/[id]/toggle-golden-border`
**Métodos:** GET, POST

**Lógica:**
1. Verificar permisos (owner o admin)
2. Verificar estado premium activo
3. Obtener límite según tipo de membresía
4. Contar bordes activos del usuario
5. Validar límite
6. Actualizar estado

#### Funciones PostgreSQL

**`count_user_active_golden_borders(p_user_id UUID)`**
- Cuenta cuántos negocios del usuario tienen el borde activo

**`get_golden_border_limit(p_user_id UUID)`**
- Retorna el límite según la membresía más reciente
- Mensual: 1
- Anual: 2

**`can_activate_golden_border(p_user_id UUID, p_business_id UUID)`**
- Valida si se puede activar el borde dorado

### 🎨 Visualización en el Feed

El borde dorado se muestra en `BusinessFeedCard.tsx` cuando:
1. `is_premium = true`
2. `premium_until > NOW()`
3. `golden_border_active = true`

**Estilos aplicados:**
- Borde: `border-2 border-yellow-500/70`
- Sombra: `shadow-xl shadow-yellow-500/30`
- Fondo: `bg-gradient-to-br from-yellow-500/5 to-orange-500/5`
- Logo: Borde dorado con sombra

---

## 3. Sistema de Notificaciones

### 🔔 NotificationModal

Componente personalizado que reemplaza los `alert()` nativos del navegador.

**Ubicación:** `src/components/ui/NotificationModal.tsx`

### 🎨 Tipos de Notificaciones

#### Success (Verde)
```typescript
showNotification("success", "Operación exitosa", "¡Éxito!")
```
- Icono: CheckCircle
- Color: Verde
- Uso: Confirmaciones de acciones exitosas

#### Error (Rojo)
```typescript
showNotification("error", "Algo salió mal", "Error")
```
- Icono: XCircle
- Color: Rojo
- Uso: Errores y fallos

#### Warning (Amarillo)
```typescript
showNotification("warning", "Ten cuidado", "Advertencia")
```
- Icono: AlertTriangle
- Color: Amarillo
- Uso: Advertencias y precauciones

#### Info (Azul)
```typescript
showNotification("info", "Información importante", "Información")
```
- Icono: Info
- Color: Azul
- Uso: Mensajes informativos

### 📝 Implementación en Componentes

```typescript
// 1. Importar
import NotificationModal from "@/components/ui/NotificationModal"

// 2. State
const [notification, setNotification] = useState({
  isOpen: false,
  type: "info" as "success" | "error" | "warning" | "info",
  title: "",
  message: "",
})

// 3. Funciones helper
const showNotification = (type, message, title = "") => {
  setNotification({ isOpen: true, type, title, message })
}

const closeNotification = () => {
  setNotification(prev => ({ ...prev, isOpen: false }))
}

// 4. Renderizar
<NotificationModal
  isOpen={notification.isOpen}
  onClose={closeNotification}
  type={notification.type}
  title={notification.title}
  message={notification.message}
/>
```

### ✅ Archivos Actualizados

- ✅ `horarios/page.tsx`
- ✅ `estadisticas/page.tsx`
- ✅ `mis-negocios/page.tsx`
- ✅ `gestionar/page.tsx`
- ✅ `galeria/page.tsx`
- ✅ `promociones/page.tsx`
- ✅ `editar/page.tsx`
- ✅ `nuevo/page.tsx`
- ✅ `mensajes/page.tsx` (ambos)
- ✅ `promociones/ver/page.tsx`
- ✅ `negocios/[id]/page.tsx`

---

## 4. Arquitectura de Base de Datos

### 📊 Tablas Principales

#### `businesses`
```sql
- id (uuid, PK)
- owner_id (uuid, FK → profiles)
- name (text)
- is_premium (boolean)
- premium_until (timestamp)
- golden_border_active (boolean) ← NUEVO
- ...
```

#### `business_subscriptions`
```sql
- id (uuid, PK)
- business_id (uuid, FK → businesses)
- user_id (uuid, FK → profiles)
- plan_id (uuid, FK → premium_plans)
- status (text: 'active', 'expired', 'cancelled')
- start_date (timestamp)
- end_date (timestamp)
- ...
```

#### `premium_plans`
```sql
- id (uuid, PK)
- name (text)
- price (numeric)
- billing_period (text: 'monthly', 'yearly')
- max_photos (integer)
- description (text)
- ...
```

### 🔗 Relaciones

```
profiles (users)
    ↓ (1:N)
businesses
    ↓ (1:N)
business_subscriptions
    ↓ (N:1)
premium_plans
```

---

## 5. Flujos de Usuario

### 🔄 Flujo 1: Activar Membresía Premium

1. Usuario va a `/app/dashboard/negocios/[id]/gestionar`
2. Ve card "Membresía Premium" (sin premium)
3. Click en "⭐ Activar Premium"
4. Redirige a `/membresia-premium`
5. Selecciona plan (Mensual o Anual)
6. Selecciona método de pago (PayPal o Manual)
7. Completa el pago
8. Sistema actualiza:
   - `businesses.is_premium = true`
   - `businesses.premium_until = NOW() + duración`
   - Crea registro en `business_subscriptions`
9. ✅ Negocio ahora es premium

### 🔄 Flujo 2: Renovar Membresía

1. Usuario va a `/app/dashboard/negocios/[id]/gestionar`
2. Ve card con información de membresía activa
3. Click en "🔄 Renovar"
4. Redirige a `/membresia-premium?action=renew`
5. Sistema pre-selecciona plan actual
6. Muestra cálculo de días: `Actuales + Nuevos = Total`
7. Usuario selecciona método de pago
8. Completa el pago
9. Sistema suma días a `premium_until`
10. ✅ Membresía extendida

### 🔄 Flujo 3: Cambiar Plan

1. Usuario va a `/app/dashboard/negocios/[id]/gestionar`
2. Click en "💎 Cambiar Plan"
3. Redirige a `/membresia-premium?action=change`
4. Sistema muestra todos los planes disponibles
5. Usuario selecciona nuevo plan (ej: de Mensual a Anual)
6. Selecciona método de pago
7. Completa el pago
8. Sistema:
   - Calcula días restantes del plan actual
   - Suma días al nuevo plan
   - Actualiza `premium_until`
   - Crea nueva suscripción
9. ✅ Plan cambiado, días sumados

### 🔄 Flujo 4: Activar Borde Dorado

1. Usuario tiene negocio premium
2. Va a `/app/dashboard/negocios/[id]/gestionar`
3. Ve botón "✨ Activar Borde" (si límite no alcanzado)
4. Click en el botón
5. Sistema valida:
   - Usuario es owner o admin
   - Negocio es premium activo
   - Límite no alcanzado
6. Actualiza `golden_border_active = true`
7. ✅ Borde dorado visible en dashboard

### 🔄 Flujo 5: Desactivar Borde Dorado

1. Usuario tiene borde activo en Negocio A
2. Quiere activarlo en Negocio B
3. Va a Negocio A → Gestionar
4. Click en "✨ Borde Activo" (dorado)
5. Sistema desactiva: `golden_border_active = false`
6. Va a Negocio B → Gestionar
7. Ahora ve "✨ Activar Borde" (disponible)
8. Click para activar
9. ✅ Borde movido de A a B

---

## 6. Guía de Implementación

### 📋 Checklist de Instalación

#### Paso 1: Base de Datos

1. **Ejecutar script de borde dorado:**
   ```sql
   -- En Supabase SQL Editor
   scripts/add-golden-border-control.sql
   ```

2. **Verificar tablas:**
   - ✅ `businesses.golden_border_active` existe
   - ✅ Funciones PostgreSQL creadas
   - ✅ Índices optimizados

#### Paso 2: Verificar Archivos

1. **Componentes:**
   - ✅ `GoldenBorderToggle.tsx`
   - ✅ `NotificationModal.tsx`
   - ✅ `BusinessFeedCard.tsx` (actualizado)

2. **Páginas:**
   - ✅ `membresia-premium/page.tsx`
   - ✅ `gestionar/page.tsx` (con card mejorada)

3. **API Routes:**
   - ✅ `/api/businesses/[id]/toggle-golden-border/route.ts`

#### Paso 3: Configuración

1. **Variables de entorno:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **PayPal (si aplica):**
   ```env
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   ```

#### Paso 4: Testing

1. **Crear negocio de prueba**
2. **Activar premium** (usar pago manual para testing)
3. **Verificar borde dorado:**
   - Activar en Negocio A
   - Verificar límite en Negocio B
   - Desactivar en A, activar en B
4. **Probar renovación**
5. **Probar cambio de plan**

---

## 📊 Métricas y KPIs

### Métricas de Conversión
- **Tasa de activación premium:** % usuarios que activan premium
- **Tasa de renovación:** % que renuevan antes de expirar
- **Conversión mensual → anual:** % que cambian a plan anual
- **Uso de borde dorado:** % negocios premium con borde activo

### Métricas de Negocio
- **MRR (Monthly Recurring Revenue):** Ingresos mensuales recurrentes
- **ARR (Annual Recurring Revenue):** Ingresos anuales recurrentes
- **Churn Rate:** % de usuarios que no renuevan
- **LTV (Lifetime Value):** Valor de vida del cliente

---

## 🔒 Seguridad

### Validaciones Implementadas

1. **Permisos:**
   - Solo owner o admin puede gestionar membresía
   - Solo owner o admin puede activar borde dorado

2. **Límites:**
   - Validación de límite de borde dorado en backend
   - Validación de estado premium antes de activar borde

3. **Pagos:**
   - Verificación de pago en PayPal
   - Aprobación manual para pagos manuales

---

## 🚀 Futuras Mejoras

### Corto Plazo
- [ ] Dashboard de analytics para negocios premium
- [ ] Notificaciones push antes de expiración
- [ ] Descuentos por renovación temprana

### Mediano Plazo
- [ ] Plan trimestral y semestral
- [ ] Programa de referidos
- [ ] Badges adicionales (Verificado, Top Rated)

### Largo Plazo
- [ ] Suscripciones automáticas (recurring)
- [ ] Sistema de cupones y descuentos
- [ ] Programa de lealtad

---

## 📞 Soporte

### Problemas Comunes

**1. Borde dorado no aparece:**
- Verificar `golden_border_active = true` en DB
- Verificar `is_premium = true` y `premium_until > NOW()`
- Limpiar caché del navegador

**2. No puedo activar borde dorado:**
- Verificar límite no alcanzado
- Verificar membresía activa
- Revisar logs de API route

**3. Días no se suman al renovar:**
- Verificar lógica en `approve/route.ts` y `capture-order/route.ts`
- Revisar logs de servidor

---

## 📚 Referencias

### Documentos Relacionados
- `SISTEMA-BORDE-DORADO-TOGGLE.md` - Detalles del toggle
- `NUEVO-SISTEMA-PREMIUM-POR-NEGOCIO.md` - Modelo de negocio
- `ACTUALIZACION-CARD-MEMBRESIA-PREMIUM.md` - Card detallada

### Scripts SQL
- `add-golden-border-control.sql` - Setup de borde dorado
- `create-venezuela-locations.sql` - Ubicaciones jerárquicas

---

**Última actualización:** Diciembre 2024
**Versión:** 2.0
**Estado:** ✅ Producción

---

**Desarrollado con ❤️ para Encuentra**

