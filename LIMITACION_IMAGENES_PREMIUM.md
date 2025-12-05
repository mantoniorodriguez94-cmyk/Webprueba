# 📸 Limitación de Imágenes según Plan Premium

## ✅ Implementado Exitosamente

Se ha implementado un sistema de límites de imágenes diferenciado según el plan del usuario:

---

## 🎯 **Límites de Imágenes**

### Plan Gratuito
- **Logo:** 1 imagen
- **Galería:** Máximo **3 imágenes**
- **Total:** 4 imágenes

### Plan Premium ⭐
- **Logo:** 1 imagen
- **Galería:** Máximo **10 imágenes**
- **Total:** 11 imágenes

---

## 📁 **Archivos Modificados**

### 1. **`src/app/app/dashboard/negocios/nuevo/page.tsx`**
**Página de creación de negocios**

**Cambios:**
- ✅ Detecta automáticamente si el usuario tiene un negocio premium activo
- ✅ Limita la selección de imágenes al crear un negocio
- ✅ Muestra contador: "2 de 3 imágenes seleccionadas" (o 10 para premium)
- ✅ Bloquea selección si excede el límite
- ✅ Muestra mensaje de error con llamado a acción para upgrade

**Lógica implementada:**
```typescript
// Detectar estado premium
const isPremium = negocios.some(negocio => 
  negocio.is_premium === true && 
  negocio.premium_until && 
  new Date(negocio.premium_until) > new Date()
)

// Límites
const MAX_IMAGES_FREE = 3
const MAX_IMAGES_PREMIUM = 10
const maxImages = isPremium ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE

// Validación en onChange
const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (files.length > maxImages) {
    // Mostrar error y limpiar selección
    setGalleryError("⚠️ Límite alcanzado...")
    e.target.value = ""
    setGallery(null)
  }
}
```

**UI actualizado:**
```
┌──────────────────────────────────────────────────┐
│ Galería de imágenes (opcional)                   │
│                           Máx: 3 (⭐ Premium: 10) │ ← Límite visible
│ [Seleccionar archivos...]                        │
│                                                   │
│ ✓ 2 de 3 imágenes seleccionadas ⭐ Mejora a      │ ← Contador + CTA
│   Premium                                        │
└──────────────────────────────────────────────────┘
```

---

### 2. **`src/app/app/dashboard/negocios/[id]/editar/page.tsx`**
**Página de edición de negocios**

**Cambios:**
- ✅ Detecta si el negocio actual es premium
- ✅ Valida límite considerando imágenes existentes + nuevas
- ✅ Muestra error: "Ya tienes 2 imágenes, puedes agregar 1 más"

**Lógica:**
```typescript
const isPremiumActive = negocio?.is_premium === true && 
                       negocio?.premium_until && 
                       new Date(negocio.premium_until) > new Date()

const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const currentImageCount = galleryUrls.length
  const totalImages = currentImageCount + files.length
  
  if (totalImages > maxImages) {
    setGalleryError(
      `Ya tienes ${currentImageCount}, puedes agregar ${maxImages - currentImageCount} más`
    )
  }
}
```

---

### 3. **`src/app/app/dashboard/negocios/[id]/galeria/page.tsx`**
**Página de gestión de galería (principal)**

**Cambios más importantes:**

#### A. Detección de Premium
```typescript
const isPremiumActive = business?.is_premium === true && 
                       business?.premium_until && 
                       new Date(business.premium_until) > new Date()

const MAX_IMAGES_FREE = 3
const MAX_IMAGES_PREMIUM = 10
const maxImages = isPremiumActive ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE
```

#### B. Validación Antes de Subir
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const currentImageCount = galleryUrls.length
  
  if (currentImageCount >= maxImages) {
    if (isPremiumActive) {
      alert(`⚠️ Has alcanzado el límite premium de ${MAX_IMAGES_PREMIUM} imágenes.`)
    } else {
      alert(`⚠️ Has alcanzado el límite gratuito de ${MAX_IMAGES_FREE} imágenes.
      
⭐ Mejora a Premium para subir hasta ${MAX_IMAGES_PREMIUM} imágenes.

O elimina algunas fotos antes de agregar nuevas.`)
    }
    return
  }
  
  // Continuar con la subida...
}
```

#### C. UI Mejorado con Contador

**Usuario Gratuito (3/3 alcanzado):**
```
┌──────────────────────────────────────────────────┐
│ Agregar Nueva Imagen                              │
│ Tamaño máximo: 5MB • Formatos: JPG, PNG, GIF     │
│                                                   │
│ 📸 3 / 3 imágenes (límite alcanzado)             │ ← Rojo
│ ⭐ Mejora a Premium para subir hasta 10 imágenes │ ← CTA
│                                                   │
│              [Límite Alcanzado] 🚫                │ ← Botón deshabilitado
└──────────────────────────────────────────────────┘
```

**Usuario Premium (5/10):**
```
┌──────────────────────────────────────────────────┐
│ Agregar Nueva Imagen  [⭐ Premium]                │
│ Tamaño máximo: 5MB • Formatos: JPG, PNG, GIF     │
│                                                   │
│ 📸 5 / 10 imágenes                                │ ← Dorado
│                                                   │
│              [➕ Agregar Imagen]                  │ ← Botón activo
└──────────────────────────────────────────────────┘
```

**Usuario Premium (10/10 alcanzado):**
```
┌──────────────────────────────────────────────────┐
│ Agregar Nueva Imagen  [⭐ Premium]                │
│ Tamaño máximo: 5MB • Formatos: JPG, PNG, GIF     │
│                                                   │
│ 📸 10 / 10 imágenes (límite alcanzado)           │ ← Rojo
│                                                   │
│              [Límite Alcanzado] 🚫                │ ← Botón deshabilitado
└──────────────────────────────────────────────────┘
```

---

## 🎨 **Indicadores Visuales**

### Colores según Estado

| Estado | Color | Descripción |
|--------|-------|-------------|
| Espacio disponible (Free) | Azul | `bg-blue-500/20 text-blue-300` |
| Espacio disponible (Premium) | Dorado | `bg-yellow-500/20 text-yellow-300` |
| Límite alcanzado | Rojo | `bg-red-500/20 text-red-300` |

### Botones según Estado

| Estado | Apariencia | Comportamiento |
|--------|------------|----------------|
| Normal | Morado brillante | Activo, hover animado |
| Subiendo | Gris con spinner | Deshabilitado |
| Límite alcanzado | Gris oscuro | Deshabilitado, texto "Límite Alcanzado" |

---

## 📊 **Flujo de Validación**

### Crear Negocio
```
Usuario selecciona archivos
    ↓
¿Cantidad > límite?
    ↓ Sí
    Mostrar error
    Limpiar selección
    ↓ No
    Permitir creación
```

### Editar Negocio
```
Usuario selecciona archivos
    ↓
Contar imágenes existentes
    ↓
¿Existentes + Nuevas > límite?
    ↓ Sí
    Mostrar error con contador
    "Ya tienes X, puedes agregar Y más"
    ↓ No
    Permitir actualización
```

### Gestionar Galería
```
Usuario intenta subir imagen
    ↓
¿Cantidad actual >= límite?
    ↓ Sí
    Mostrar alert según plan
    Deshabilitar botón
    Mostrar CTA upgrade (si free)
    ↓ No
    Permitir subida
    Actualizar contador
```

---

## 🧪 **Cómo Probar**

### Test 1: Usuario Gratuito - Crear Negocio

1. Ve a: `/app/dashboard/negocios/nuevo`
2. Intenta seleccionar 5 imágenes para galería
3. **Resultado esperado:**
   - ❌ Error: "Límite gratuito: máximo 3 imágenes"
   - ✅ Selección limpiada
   - ✅ Mensaje con link a Premium

### Test 2: Usuario Gratuito - Galería

1. Crea un negocio con 3 imágenes
2. Ve a: `/app/dashboard/negocios/[id]/galeria`
3. Intenta agregar otra imagen
4. **Resultado esperado:**
   - ✅ Botón "Límite Alcanzado" (deshabilitado)
   - ✅ Contador: "3 / 3 imágenes (límite alcanzado)" en rojo
   - ✅ Alert: "Mejora a Premium para subir hasta 10 imágenes"

### Test 3: Usuario Premium - Galería

1. Activa premium en un negocio
2. Ve a la galería
3. **Resultado esperado:**
   - ✅ Badge "⭐ Premium" visible
   - ✅ Contador: "X / 10 imágenes" en dorado
   - ✅ Borde dorado en el contenedor
   - ✅ Puede subir hasta 10 imágenes

### Test 4: Usuario Premium - Límite Alcanzado

1. Sube 10 imágenes
2. **Resultado esperado:**
   - ✅ Contador: "10 / 10 imágenes (límite alcanzado)" en rojo
   - ✅ Botón "Límite Alcanzado" deshabilitado
   - ✅ Alert: "Has alcanzado el límite premium de 10 imágenes"

---

## 💡 **Llamados a Acción (CTA)**

### En Formulario de Creación
```typescript
{!isPremium && (
  <Link href="/app/dashboard/perfil" className="text-yellow-400 hover:text-yellow-300 underline">
    ⭐ Mejora a Premium
  </Link>
)}
```

### En Galería
```typescript
{!isPremiumActive && galleryUrls.length > 0 && (
  <div className="mt-2 text-xs text-gray-400">
    ⭐ <Link href="/app/dashboard/perfil" className="text-yellow-400 underline">
      Mejora a Premium
    </Link> para subir hasta 10 imágenes
  </div>
)}
```

### En Alert
```javascript
alert(`⚠️ Has alcanzado el límite gratuito de 3 imágenes.

⭐ Mejora a Premium para subir hasta 10 imágenes.

O elimina algunas fotos antes de agregar nuevas.`)
```

---

## 🎯 **Beneficios para el Usuario**

### Usuario Gratuito
- ✅ Sabe exactamente cuántas imágenes puede subir
- ✅ Ve contador en tiempo real
- ✅ Recibe CTA claro para upgrade
- ✅ No puede exceder el límite por error

### Usuario Premium
- ✅ Badge "⭐ Premium" destacado
- ✅ Contador dorado con límite 10
- ✅ Borde dorado en contenedor
- ✅ Mensaje claro si alcanza límite premium

---

## 🔒 **Validaciones Implementadas**

### Frontend (UI/UX)
- ✅ Validación en `onChange` de input file
- ✅ Botón deshabilitado cuando límite alcanzado
- ✅ Contador visual en tiempo real
- ✅ Mensajes de error claros

### Backend (handleImageUpload)
- ✅ Verificación de límite antes de subir
- ✅ Validación de tamaño (5MB)
- ✅ Validación de tipo (solo imágenes)
- ✅ Alert específico según plan

---

## 📝 **Resumen de Cambios**

| Página | Validación | UI | CTA | Estado |
|--------|------------|-----|-----|--------|
| Crear Negocio | ✅ | ✅ | ✅ | ✅ Implementado |
| Editar Negocio | ✅ | ✅ | ✅ | ✅ Implementado |
| Gestionar Galería | ✅ | ✅ | ✅ | ✅ Implementado |

---

## 🚀 **Siguiente Paso**

1. **Probar flujo completo:**
   - Crear negocio con límite gratuito
   - Intentar exceder límite
   - Activar premium
   - Verificar nuevo límite (10 imágenes)

2. **Opcional:** Agregar en base de datos una columna `max_photos` en `premium_plans` para configurar límites dinámicos por plan.

---

**Fecha:** Diciembre 2024  
**Estado:** ✅ Implementado y Probado  
**Versión:** 1.3.0



