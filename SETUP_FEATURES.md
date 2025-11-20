# Configuración de Funcionalidades de Gestión de Negocios

Este documento explica cómo configurar todas las nuevas funcionalidades de gestión de negocios en Supabase.

## 📋 Requisitos Previos

- Cuenta de Supabase activa
- Proyecto de Supabase configurado
- Acceso al SQL Editor de Supabase

## 🚀 Pasos de Configuración

### 1. Agregar Campo de Horarios

Ejecuta el script para agregar el campo `hours` a la tabla `businesses`:

```bash
# En Supabase SQL Editor, ejecuta:
scripts/add-hours-field.sql
```

Este script:
- Agrega la columna `hours` de tipo TEXT
- Permite almacenar horarios en formato JSON

### 2. Crear Tabla de Promociones

Ejecuta el script para crear la tabla de promociones:

```bash
# En Supabase SQL Editor, ejecuta:
scripts/create-promotions-table.sql
```

Este script crea:
- Tabla `promotions` con todos sus campos
- Índices para mejor rendimiento
- Políticas RLS (Row Level Security)
- Vista para contar promociones activas

### 3. Configurar Storage Buckets

Ejecuta el script para crear los buckets de almacenamiento:

```bash
# En Supabase SQL Editor, ejecuta:
scripts/create-storage-buckets.sql
```

Este script crea:
- Bucket `business-gallery` para imágenes de galería
- Bucket `promotions-images` para imágenes de promociones
- Políticas de seguridad para ambos buckets
- Límite de 5MB por archivo

## 📁 Estructura de las Nuevas Funcionalidades

### 1. Gestión de Galería
**Ruta:** `/app/dashboard/negocios/[id]/galeria`

**Características:**
- ✅ Ver todas las fotos del negocio
- ✅ Agregar nuevas imágenes (máx. 5MB)
- ✅ Eliminar imágenes existentes
- ✅ Vista ampliada de imágenes
- ✅ Solo accesible por dueño y admin

**Permisos:**
- **Dueño del negocio:** Puede gestionar su propia galería
- **Administrador:** Puede gestionar cualquier galería
- **Visitantes:** Solo pueden ver galería (ruta principal)

### 2. Configuración de Horarios
**Ruta:** `/app/dashboard/negocios/[id]/horarios`

**Características:**
- ✅ Configurar horarios por día de la semana
- ✅ Marcar días como abiertos/cerrados
- ✅ Establecer hora de apertura y cierre
- ✅ Botón "Aplicar a todos" para replicar horario
- ✅ Almacenamiento en formato JSON

**Formato de Datos:**
```json
[
  {
    "day": "Lunes",
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "18:00"
  },
  ...
]
```

### 3. Gestión de Promociones
**Ruta:** `/app/dashboard/negocios/[id]/promociones`

**Características:**
- ✅ Crear nuevas promociones
- ✅ Subir imagen por promoción
- ✅ Establecer precio
- ✅ Definir rango de fechas
- ✅ Activar/desactivar promociones
- ✅ Eliminar promociones
- ✅ Estados: Activa, Inactiva, Próximamente, Expirada

**Campos de Promoción:**
- `name`: Nombre de la promoción (requerido)
- `image_url`: URL de la imagen (opcional)
- `price`: Precio en formato decimal (opcional)
- `start_date`: Fecha de inicio (requerido)
- `end_date`: Fecha de fin (requerido)
- `is_active`: Estado activo/inactivo

### 4. Vista de Detalles del Negocio
**Ruta:** `/app/dashboard/negocios/[id]`

**Acceso:** Todos los usuarios autenticados

**Secciones Visibles:**
- 📸 **Galería de Fotos**
  - Dueño/Admin: Botón "Gestionar Galería"
  - Visitantes: Botón "Ver Galería"
  
- ⏰ **Horarios**
  - Dueño/Admin: Botón "Configurar Horarios"
  - Visitantes: Botón "Ver Horarios"
  
- 🎁 **Promociones**
  - Dueño/Admin: Botón "Gestionar Promociones"
  - Visitantes: Botón "Ver Promociones"

### 5. Panel de Gestión Completo
**Ruta:** `/app/dashboard/negocios/[id]/gestionar`

**Acceso:** Solo dueño del negocio

**Secciones:**
- Galería de Fotos
- Mensajes
- Estadísticas
- Horarios
- Promociones
- Configuración

## 🎨 Diseño Visual

Todos los componentes siguen el sistema de diseño de la aplicación:

### Colores por Funcionalidad
- **Galería:** Púrpura (`from-purple-400 to-purple-600`)
- **Horarios:** Naranja (`from-orange-400 to-orange-600`)
- **Promociones:** Rosa (`from-pink-400 to-pink-600`)
- **Mensajes:** Verde (`from-green-400 to-green-600`)
- **General:** Azul (`from-[#0288D1] to-[#0277BD]`)

### Elementos Visuales
- ✅ Cards con efecto glassmorphism
- ✅ Animaciones suaves en hover
- ✅ Modales responsive (mobile-first)
- ✅ Iconos SVG consistentes
- ✅ Estados de carga animados
- ✅ Feedback visual claro

## 🔒 Seguridad

### Row Level Security (RLS)

**Tabla `promotions`:**
- ✅ Todos pueden ver promociones activas
- ✅ Solo el dueño puede crear/editar/eliminar sus promociones
- ✅ Admins tienen acceso completo (implementar si necesario)

**Storage Buckets:**
- ✅ Lectura pública para todas las imágenes
- ✅ Solo el dueño puede subir/modificar/eliminar en su carpeta
- ✅ Límite de 5MB por archivo
- ✅ Solo formatos de imagen permitidos

## 📱 Responsive Design

Todas las páginas están optimizadas para:
- 📱 **Mobile:** Layout vertical, controles táctiles grandes
- 💻 **Tablet:** Grids de 2 columnas
- 🖥️ **Desktop:** Grids de 3-4 columnas, sidebars

## 🧪 Testing

### Flujo de Prueba Completo

1. **Como Dueño de Negocio:**
   ```
   1. Crear un negocio
   2. Acceder desde "Mis Negocios"
   3. Ir a Gestionar Galería → Subir 3 fotos
   4. Ir a Configurar Horarios → Establecer horarios
   5. Ir a Promociones → Crear 2 promociones
   6. Verificar que todo se muestra correctamente
   ```

2. **Como Usuario Regular:**
   ```
   1. Ir al dashboard
   2. Hacer clic en un negocio
   3. Ver galería de fotos
   4. Ver horarios (cuando estén disponibles)
   5. Ver promociones (cuando estén disponibles)
   ```

3. **Como Admin:**
   ```
   1. Acceder a cualquier negocio
   2. Gestionar galería de otros usuarios
   3. Configurar horarios de cualquier negocio
   4. Gestionar promociones de cualquier negocio
   ```

## 🐛 Troubleshooting

### Error: "gallery_urls.map is not a function"
**Solución:** El campo `gallery_urls` se parsea automáticamente ahora. Si persiste, verifica que la base de datos esté actualizada.

### Error: "No se puede subir imagen"
**Solución:** 
1. Verifica que los buckets estén creados en Supabase Storage
2. Ejecuta `scripts/create-storage-buckets.sql`
3. Verifica los permisos RLS en Storage

### Error: "No se pueden ver las promociones"
**Solución:**
1. Ejecuta `scripts/create-promotions-table.sql`
2. Verifica que la tabla `promotions` exista
3. Verifica las políticas RLS

## 📚 Recursos Adicionales

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentación de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guía de Next.js Image](https://nextjs.org/docs/basic-features/image-optimization)

## ✅ Checklist de Configuración

- [ ] Ejecutar `add-hours-field.sql`
- [ ] Ejecutar `create-promotions-table.sql`
- [ ] Ejecutar `create-storage-buckets.sql`
- [ ] **IMPORTANTE:** Ejecutar `fix-promotions-policies.sql` (corrige visibilidad pública)
- [ ] **NUEVO:** Ejecutar `create-analytics-tables.sql` (sistema de estadísticas)
- [ ] Verificar buckets en Supabase Dashboard
- [ ] Probar subir imagen a galería
- [ ] Probar crear promoción
- [ ] Activar promoción y verificar que se vea para otros usuarios
- [ ] Probar configurar horarios
- [ ] Verificar sistema de estadísticas
- [ ] Verificar tracking de visitas
- [ ] Verificar permisos de usuarios regulares
- [ ] Verificar permisos de administradores

---

## 🔧 Corrección Importante: Visibilidad de Promociones

Si ya ejecutaste `create-promotions-table.sql` antes y las promociones no se ven públicamente:

**Ejecuta:** `scripts/fix-promotions-policies.sql`

Este script:
- ✅ Elimina las políticas antiguas restrictivas
- ✅ Crea políticas que permiten ver promociones activas sin login
- ✅ Permite a los dueños ver todas sus promociones (activas/inactivas)
- ✅ Valida que las promociones estén dentro del rango de fechas

**Nota:** Todos los scripts SQL deben ejecutarse en el SQL Editor de Supabase en el orden indicado.

