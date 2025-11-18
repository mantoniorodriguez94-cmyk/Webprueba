# Sistema de Usuarios y Feed - Encuentra

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de distinción entre usuarios **Persona** y **Empresa**, con un feed público estilo Facebook y un panel de gestión empresarial.

---

## 🎯 Características Implementadas

### 1. Sistema de Tipos de Usuario

#### Usuarios Tipo "Persona"
- **Capacidad de crear negocios:** 0 (no pueden crear negocios)
- **Vista principal:** Feed público de todos los negocios
- **Funcionalidades:**
  - Explorar negocios existentes
  - Filtrar por categoría, ubicación y búsqueda
  - Ver información de contacto
  - Contactar negocios vía WhatsApp
  - Descubrir eventos destacados

#### Usuarios Tipo "Empresa"
- **Capacidad de crear negocios:** 5 por defecto (configurable)
- **Vista principal:** Panel de gestión de negocios
- **Funcionalidades:**
  - Crear hasta 5 negocios
  - Editar y eliminar sus negocios
  - Ver contador de negocios (usados/permitidos)
  - Acceder al feed público
  - Gestión completa de negocios

---

## 🎨 Componentes Creados

### 1. **BusinessFeedCard** (`src/components/feed/BusinessFeedCard.tsx`)
Tarjeta de negocio para el feed público con:
- Logo y nombre del negocio
- Categoría y descripción
- Galería de imágenes (hasta 3 visibles)
- Información de ubicación y contacto
- Badge "Nuevo" para negocios recientes (últimos 7 días)
- Botones de acción (WhatsApp, Ver más)
- Efectos hover modernos

### 2. **FilterSidebar** (`src/components/feed/FilterSidebar.tsx`)
Sidebar izquierdo con filtros avanzados:
- **Búsqueda:** Por nombre o descripción
- **Categorías:** 11 categorías predefinidas
- **Ubicación:** Filtro por dirección/ciudad
- **Ordenamiento:** Recientes, Alfabético, Populares
- **Responsivo:** Se oculta en móvil con botón flotante
- Botón para limpiar todos los filtros

### 3. **HighlightsSidebar** (`src/components/feed/HighlightsSidebar.tsx`)
Sidebar derecho con contenido destacado:
- **Eventos Destacados:** Calendario de eventos con fecha y ubicación
- **Negocios Destacados:** Top 5 negocios con rating
- **Tip del día:** Sugerencias y consejos
- Animaciones escalonadas para cada elemento

---

## 🔄 Páginas Modificadas

### 1. **Registro** (`src/app/app/auth/register/page.tsx`)
- Selector visual mejorado de tipo de usuario
- Tarjetas interactivas para Persona/Empresa
- Asignación automática de `allowed_businesses`:
  - Persona: 0
  - Empresa: 5
- Validación de contraseña mejorada
- UI moderna con animaciones

### 2. **Dashboard** (`src/app/app/dashboard/page.tsx`)
Ahora tiene **2 vistas distintas:**

#### Vista para Personas:
- Layout estilo Facebook con 3 columnas
- Feed central con tarjetas de negocios
- Sidebar izquierdo con filtros
- Sidebar derecho con destacados
- Header sticky con navegación
- Sistema de filtrado en tiempo real

#### Vista para Empresas:
- Panel de gestión de negocios
- Contador de negocios (usados/total)
- Grid de tarjetas de negocios propios
- Botón "Crear negocio" (solo si no alcanzó el límite)
- Tabs para cambiar entre "Mis Negocios" y "Explorar Feed"
- Opciones de editar/eliminar por cada negocio

---

## 💅 Estilos y Animaciones

### Nuevas Animaciones CSS (`src/app/globals.css`)

1. **fadeIn:** Aparición suave con desplazamiento
2. **slideInLeft/Right:** Entrada lateral
3. **scaleIn:** Efecto de zoom al aparecer
4. **pulse-soft:** Pulsación suave continua
5. **shimmer:** Efecto de brillo/carga
6. **bounceIn:** Entrada con rebote
7. **gradientShift:** Gradiente animado
8. **hover-glow:** Brillo al pasar el mouse
9. **glass-morphism:** Efecto de vidrio esmerilado
10. **card-lift:** Elevación de tarjetas al hover

### Características Visuales

- **Scrollbar personalizado:** Delgado y moderno
- **Transiciones suaves:** Todas las interacciones tienen transiciones
- **Efectos hover:** Escalado, sombras, colores
- **Gradientes:** De azul claro a azul oscuro (#E3F2FD → #0288D1)
- **Bordes redondeados:** 2xl y 3xl para tarjetas
- **Sombras dinámicas:** Aumentan con la interacción

---

## 🏗️ Tipos TypeScript

### Nuevos tipos (`src/types/user.ts`)

```typescript
type UserRole = "person" | "company"

interface UserMetadata {
  full_name?: string
  role?: UserRole
  allowed_businesses?: number
  avatar_url?: string
  location?: string
}

interface AppUser {
  id: string
  email?: string
  user_metadata?: UserMetadata
  created_at?: string
}

interface FilterOptions {
  category?: string
  location?: string
  searchTerm?: string
}
```

---

## 📱 Responsividad

### Breakpoints Implementados

- **Mobile (< 640px):**
  - Filtros ocultos con botón flotante
  - Tarjetas a ancho completo
  - Navegación simplificada

- **Tablet (640px - 1024px):**
  - Grid de 2 columnas para negocios
  - Sidebar de filtros visible
  - Sidebar de destacados oculto

- **Desktop (> 1024px):**
  - Layout completo de 3 columnas
  - Todos los sidebars visibles
  - Grid de hasta 3 columnas

- **Extra Large (> 1280px):**
  - Máximo ancho de contenedor: 1800px
  - Sidebar derecho más ancho (360px)
  - Espaciado optimizado

---

## 🔍 Sistema de Filtrado

### Funcionalidades de Filtrado

1. **Búsqueda de texto:**
   - Busca en nombre y descripción
   - Case-insensitive
   - Actualización en tiempo real

2. **Filtro por categoría:**
   - 11 categorías disponibles
   - Opción "Todos" para ver todo
   - Botones visuales con selección destacada

3. **Filtro por ubicación:**
   - Busca en el campo de dirección
   - Permite ciudad o dirección completa

4. **Ordenamiento:**
   - Recientes: Por fecha de creación (más nuevo primero)
   - Alfabético: Por nombre A-Z
   - Populares: Por fecha (preparado para métricas futuras)

---

## 🚀 Flujo de Usuario

### Para Personas:
1. Registro seleccionando "Persona"
2. Login al sistema
3. Redirigido al feed público
4. Explora negocios con filtros
5. Contacta negocios vía WhatsApp

### Para Empresas:
1. Registro seleccionando "Empresa"
2. Login al sistema
3. Redirigido al panel de gestión
4. Crea su primer negocio (hasta 5)
5. Gestiona sus negocios
6. Opcionalmente explora el feed

---

## 🎯 Lógica de Permisos

### Restricciones Implementadas

```javascript
// Usuarios Persona
allowed_businesses = 0
canCreateBusiness = false
showCreateButton = false

// Usuarios Empresa
allowed_businesses = 5
canCreateBusiness = currentBusinesses < 5
showCreateButton = canCreateBusiness

// En página de creación
if (currentBusinesses >= allowed_businesses) {
  redirect("/app/dashboard")
}
```

---

## 🎨 Paleta de Colores

- **Primario:** #0288D1 (Azul cielo)
- **Primario oscuro:** #0277BD
- **Secundario claro:** #E3F2FD
- **Secundario:** #BBDEFB
- **Acento:** Gradiente de primario a primario oscuro
- **Éxito:** Verde (#10B981)
- **Error:** Rojo (#EF4444)
- **Gris claro:** #F3F4F6
- **Gris medio:** #9CA3AF
- **Texto:** #1F2937

---

## ✨ Efectos Especiales

### 1. Tarjetas de Negocio
- Hover: Elevación con sombra
- Logo: Efecto de escala suave
- Imágenes de galería: Zoom al hover
- Badge "Nuevo": Gradiente animado

### 2. Botones
- Hover: Escala ligeramente (1.02-1.05)
- Active: Escala hacia abajo (0.98)
- Transiciones suaves (300ms)
- Sombras dinámicas

### 3. Filtros
- Selección con escala y color
- Transiciones suaves entre estados
- Iconos animados

### 4. Headers
- Sticky con backdrop blur
- Opacidad del 90%
- Borde inferior sutil

---

## 🔧 Configuración Recomendada

### Variables de Entorno (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### Tablas de Supabase

Asegúrate de tener configurado:
1. Tabla `businesses` con RLS habilitado
2. Bucket de storage `logos` público
3. Bucket de storage `negocios-gallery` público
4. Auth configurado con metadata de usuario

---

## 📈 Mejoras Futuras Sugeridas

1. **Sistema de favoritos** para personas
2. **Valoraciones y reviews** de negocios
3. **Eventos reales** desde base de datos
4. **Mapa interactivo** de ubicaciones
5. **Notificaciones** de nuevos negocios
6. **Chat directo** entre usuarios
7. **Estadísticas** para empresas (vistas, contactos)
8. **Planes premium** con más negocios permitidos
9. **Verificación de negocios** (badge verificado)
10. **Sistema de reportes** y moderación

---

## 🎉 Resultado Final

El sistema ahora ofrece:
- ✅ Distinción clara entre personas y empresas
- ✅ Feed público atractivo estilo Facebook
- ✅ Panel de gestión profesional para empresas
- ✅ Filtros avanzados y búsqueda
- ✅ Diseño responsivo completo
- ✅ Animaciones y efectos modernos
- ✅ UX intuitiva y fluida
- ✅ Código limpio y mantenible

---

**Desarrollado con ❤️ usando Next.js 15, React 18, TypeScript y Tailwind CSS**



