# ✨ Sistema de Control de Borde Dorado Premium

## 🎯 Objetivo

Implementar un sistema de control del borde dorado para negocios premium, permitiendo a los usuarios activar/desactivar esta característica con límites según su tipo de membresía.

---

## 📋 Especificaciones

### Límites por Tipo de Membresía:

| Membresía | Límite de Bordes Dorados |
|-----------|--------------------------|
| **Mensual** | 1 borde dorado activo |
| **Anual** | 2 bordes dorados activos |

### Reglas de Negocio:

1. ✅ Solo negocios con membresía premium activa pueden tener borde dorado
2. ✅ El usuario puede activar/desactivar el borde en cualquiera de sus negocios
3. ✅ El límite se respeta a nivel de usuario (no por negocio)
4. ✅ Si se alcanza el límite, debe desactivar un borde para activar otro
5. ✅ El sistema verifica automáticamente el tipo de membresía para aplicar el límite correcto

---

## 🗄️ Cambios en la Base de Datos

### Nuevo Campo en `businesses`:
```sql
golden_border_active BOOLEAN DEFAULT false
```

### Funciones PostgreSQL Creadas:

#### 1. `count_user_active_golden_borders(user_id UUID)`
Cuenta cuántos bordes dorados tiene activos un usuario.

```sql
SELECT count_user_active_golden_borders('user-uuid-here');
-- Retorna: INTEGER (0, 1, 2, etc.)
```

#### 2. `get_golden_border_limit(user_id UUID)`
Obtiene el límite de bordes dorados según la membresía activa del usuario.

```sql
SELECT get_golden_border_limit('user-uuid-here');
-- Retorna: 0 (sin membresía), 1 (mensual), 2 (anual)
```

#### 3. `can_activate_golden_border(user_id UUID, business_id UUID)`
Verifica si un usuario puede activar el borde dorado en un negocio específico.

```sql
SELECT can_activate_golden_border('user-uuid', 'business-uuid');
-- Retorna: BOOLEAN (true/false)
```

### Script SQL:
📄 `scripts/add-golden-border-control.sql`

**Instrucciones de ejecución:**
1. Ir a Supabase → SQL Editor
2. Copiar y pegar el script completo
3. Ejecutar (Run)
4. Verificar mensajes de confirmación ✅

---

## 🔌 API Endpoint

### `POST /api/businesses/[id]/toggle-golden-border`

**Descripción:** Activa o desactiva el borde dorado de un negocio.

**Autenticación:** Requerida

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Borde dorado activado exitosamente",
  "golden_border_active": true,
  "activeCount": 1,
  "limit": 2
}
```

**Errores posibles:**
```json
{
  "error": "Has alcanzado el límite de bordes dorados para tu membresía mensual",
  "limit": 1,
  "activeCount": 1,
  "canActivate": false
}
```

### `GET /api/businesses/[id]/toggle-golden-border`

**Descripción:** Obtiene el estado actual del borde dorado y los límites del usuario.

**Respuesta:**
```json
{
  "golden_border_active": false,
  "is_premium": true,
  "premium_until": "2024-12-31T23:59:59Z",
  "limit": 2,
  "activeCount": 1,
  "canActivate": true,
  "membershipType": "yearly"
}
```

---

## 🎨 Componente de UI

### `GoldenBorderControl`

**Ubicación:** `src/components/business/GoldenBorderControl.tsx`

**Props:**
```typescript
interface GoldenBorderControlProps {
  businessId: string
  businessName: string
  isPremium: boolean
  premiumUntil: string | null
}
```

**Características:**
- ✅ Diseño moderno con gradiente dorado
- ✅ Muestra el estado actual (Activo/Desactivado)
- ✅ Indica el tipo de membresía y límites
- ✅ Contador visual (activos / límite)
- ✅ Botón dinámico según el estado
- ✅ Notificaciones integradas con `NotificationModal`
- ✅ Deshabilitado automáticamente cuando se alcanza el límite

**Ubicación en la App:**
- Página: `/app/dashboard/negocios/[id]/gestionar`
- Sección: Destacada antes del grid de funcionalidades
- Visibilidad: Solo para negocios con membresía premium activa

---

## 📐 Flujo de Usuario

### Activar Borde Dorado:

1. Usuario navega a "Gestionar Negocio"
2. Ve el componente "Borde Dorado Premium"
3. Click en "Activar Borde Dorado"
4. Sistema verifica:
   - ✅ Negocio es premium y está activo
   - ✅ No ha alcanzado el límite de su membresía
5. Si todo OK: Activa el borde y muestra notificación de éxito
6. Si límite alcanzado: Muestra notificación explicando que debe desactivar otro primero

### Desactivar Borde Dorado:

1. Usuario click en "Desactivar Borde Dorado"
2. Sistema desactiva inmediatamente
3. Muestra notificación de confirmación
4. Contador de activos se actualiza

### Cambiar Borde a Otro Negocio:

1. Usuario tiene 2 negocios, membresía mensual (límite: 1)
2. Negocio A tiene borde activo
3. Va a Negocio B, intenta activar
4. Sistema muestra: "Límite alcanzado (1/1)"
5. Usuario va a Negocio A, desactiva el borde
6. Regresa a Negocio B, ahora puede activarlo

---

## 🎯 Casos de Uso

### Caso 1: Usuario con Membresía Mensual

**Escenario:** Juan tiene 2 negocios y membresía mensual

**Estado:**
- Negocio A: Premium, borde activo ✅
- Negocio B: Premium, borde inactivo ❌

**Acción:** Intenta activar borde en Negocio B

**Resultado:** 
```
❌ Has alcanzado el límite de bordes dorados para tu membresía mensual (1/1)
💡 Desactiva el borde dorado en otro negocio para activarlo aquí
```

---

### Caso 2: Usuario con Membresía Anual

**Escenario:** María tiene 3 negocios y membresía anual

**Estado:**
- Negocio A: Premium, borde activo ✅
- Negocio B: Premium, borde activo ✅
- Negocio C: Premium, borde inactivo ❌

**Acción:** Intenta activar borde en Negocio C

**Resultado:**
```
❌ Has alcanzado el límite de bordes dorados para tu membresía anual (2/2)
💡 Desactiva el borde dorado en otro negocio para activarlo aquí
```

---

### Caso 3: Cambio de Borde Exitoso

**Escenario:** Pedro tiene 2 negocios, membresía mensual

**Pasos:**
1. Negocio A tiene borde activo (1/1)
2. Va a Negocio A → Click "Desactivar"
3. ✅ "Borde dorado desactivado exitosamente" (0/1)
4. Va a Negocio B → Click "Activar"
5. ✅ "Borde dorado activado para Negocio B" (1/1)

---

## 🔄 Integración con Componentes Existentes

### Actualizar Tarjetas de Negocio:

**Antes:**
```tsx
{business.is_premium && (
  <div className="ring-4 ring-amber-400">
    {/* Contenido */}
  </div>
)}
```

**Después:**
```tsx
{business.is_premium && business.golden_border_active && (
  <div className="ring-4 ring-amber-400">
    {/* Contenido */}
  </div>
)}
```

**Archivos a actualizar:**
- `src/components/feed/BusinessCard.tsx`
- `src/components/feed/BusinessFeedCard.tsx`
- `src/app/app/dashboard/mis-negocios/page.tsx`
- `src/app/app/dashboard/page.tsx`

---

## 🎨 Diseño Visual del Componente

```
┌─────────────────────────────────────────────┐
│  ⭐ Borde Dorado Premium                    │
│     Destaca tu negocio con el borde dorado  │
│                                             │
│  ╔═══════════════════════════════════════╗  │
│  ║ ℹ️ Membresía Mensual: 1 borde dorado ║  │
│  ║                                       ║  │
│  ║ Bordes activos: 1 / 1                ║  │
│  ╚═══════════════════════════════════════╝  │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ Estado actual                          │ │
│  │ ● Activo                               │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │      Desactivar Borde Dorado          │ │
│  └────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Colores:**
- Fondo: Gradiente dorado/amarillo (`from-amber-500/10 to-yellow-500/10`)
- Borde: Dorado semitransparente (`border-amber-500/30`)
- Botón activo: Gradiente dorado sólido
- Botón desactivar: Gris oscuro
- Botón deshabilitado: Gris con cursor not-allowed

---

## 📊 Lógica de Límites

### Diagrama de Flujo:

```
¿Intento activar borde?
    ↓
¿Negocio es premium activo?
    ↓ NO → ❌ Error: "Requiere membresía premium"
    ↓ SÍ
¿Qué tipo de membresía?
    ↓
    ├─ Mensual → Límite = 1
    └─ Anual → Límite = 2
    ↓
Contar bordes activos actuales
    ↓
¿Activos < Límite?
    ↓ NO → ❌ Error: "Límite alcanzado"
    ↓ SÍ
✅ Activar borde dorado
```

---

## 🧪 Testing

### Casos de Prueba:

#### 1. Activar borde (límite no alcanzado)
```
✓ Usuario con 0/1 activos puede activar
✓ Usuario con 1/2 activos puede activar
✓ Contador se actualiza correctamente
✓ Notificación de éxito se muestra
```

#### 2. Activar borde (límite alcanzado)
```
✓ Usuario con 1/1 NO puede activar
✓ Usuario con 2/2 NO puede activar
✓ Botón aparece deshabilitado
✓ Notificación de límite se muestra
```

#### 3. Desactivar borde
```
✓ Borde se desactiva correctamente
✓ Contador disminuye
✓ Notificación de confirmación
✓ Otros negocios ahora pueden activar
```

#### 4. Negocio sin membresía
```
✓ Componente NO se muestra
✓ API rechaza la petición
```

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
1. ✅ `scripts/add-golden-border-control.sql`
2. ✅ `src/app/api/businesses/[id]/toggle-golden-border/route.ts`
3. ✅ `src/components/business/GoldenBorderControl.tsx`
4. ✅ `SISTEMA-BORDE-DORADO.md` (documentación)

### Archivos Modificados:
1. ✅ `src/app/app/dashboard/negocios/[id]/gestionar/page.tsx`
   - Importado `GoldenBorderControl`
   - Agregado componente en la UI
   - Agregado `NotificationModal`

### Archivos Pendientes de Actualizar:
- `src/components/feed/BusinessCard.tsx`
- `src/components/feed/BusinessFeedCard.tsx`
- `src/app/app/dashboard/mis-negocios/page.tsx`
- `src/app/app/dashboard/page.tsx`

---

## 🚀 Implementación

### Paso 1: Base de Datos
```bash
1. Abrir Supabase → SQL Editor
2. Copiar scripts/add-golden-border-control.sql
3. Ejecutar
4. Verificar mensajes de confirmación
```

### Paso 2: Verificar API
```bash
# La API route ya está creada en:
src/app/api/businesses/[id]/toggle-golden-border/route.ts
```

### Paso 3: Probar en UI
```bash
1. Ir a /app/dashboard/negocios/[id]/gestionar
2. Ver componente "Borde Dorado Premium"
3. Probar activar/desactivar
4. Verificar límites
```

---

## 💡 Mejoras Futuras (Opcionales)

1. **Dashboard de Resumen:**
   - Vista global de todos los negocios
   - Indicador visual de cuáles tienen borde activo
   - Botón rápido para cambiar entre negocios

2. **Historial:**
   - Registro de cambios de activación/desactivación
   - Timestamp de cada cambio

3. **Analytics:**
   - Métricas de impacto del borde dorado
   - Comparación de visitas con/sin borde

4. **Auto-priorización:**
   - Sugerencia de qué negocio debería tener el borde
   - Basado en métricas (visitas, reviews, etc.)

---

## ✅ Checklist de Implementación

- [x] Script SQL creado
- [x] Funciones PostgreSQL implementadas
- [x] API route POST implementada
- [x] API route GET implementada
- [x] Componente GoldenBorderControl creado
- [x] Integrado en página de gestionar
- [x] NotificationModal integrado
- [ ] Actualizar componentes de tarjetas de negocio
- [ ] Testing en desarrollo
- [ ] Testing en producción
- [ ] Documentación completa

---

**Estado:** ✅ **IMPLEMENTADO (Fase 1)**

El sistema de control de borde dorado está funcionalmente completo. Falta actualizar los componentes de visualización para que solo muestren el borde dorado cuando `golden_border_active = true`. 🎉

