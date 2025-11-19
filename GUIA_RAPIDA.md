# 🚀 Guía Rápida de Uso - Sistema de Usuarios

## ⚡ Inicio Rápido

### 1. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 👤 Tipos de Usuario

### Persona (Usuario Regular)
**¿Para quién?** Usuarios que solo quieren explorar y descubrir negocios.

**Registro:**
1. Ve a `/app/auth/register`
2. Selecciona la tarjeta "Persona"
3. Completa el formulario
4. Inicia sesión

**¿Qué puedo hacer?**
- ✅ Ver feed público de todos los negocios
- ✅ Filtrar por categoría, ubicación
- ✅ Buscar negocios específicos
- ✅ Contactar negocios por WhatsApp
- ✅ Ver eventos destacados
- ❌ NO puedo crear negocios

---

### Empresa (Usuario Comercial)
**¿Para quién?** Propietarios de negocios que quieren crear y gestionar su presencia.

**Registro:**
1. Ve a `/app/auth/register`
2. Selecciona la tarjeta "Empresa"
3. Completa el formulario
4. Inicia sesión

**¿Qué puedo hacer?**
- ✅ Crear hasta 5 negocios
- ✅ Editar mis negocios
- ✅ Eliminar mis negocios
- ✅ Ver panel de gestión
- ✅ Explorar feed público
- ✅ Subir logo y galería de imágenes

---

## 📱 Navegación

### Para Personas
```
Login → Dashboard (Feed) → Explorar negocios
                         → Filtrar/Buscar
                         → Ver eventos
```

### Para Empresas
```
Login → Dashboard (Panel) → Crear negocio
                          → Editar negocios
                          → Ver mis negocios
                          → Explorar feed
```

---

## 🎯 Funcionalidades Principales

### Feed Público (Personas)

**Sidebar Izquierdo - Filtros:**
- 🔍 Búsqueda por nombre
- 🏷️ 11 categorías disponibles
- 📍 Filtro por ubicación
- 🔄 Ordenar: Recientes/Alfabético/Populares

**Feed Central:**
- 📱 Tarjetas de negocios con toda la información
- 🖼️ Galería de hasta 3 imágenes
- 📞 Botón directo a WhatsApp
- ⭐ Badge "Nuevo" en negocios recientes

**Sidebar Derecho - Destacados:**
- 📅 Eventos próximos
- ⭐ Negocios destacados
- 💡 Tips útiles

---

### Panel de Gestión (Empresas)

**Dashboard:**
- 📊 Contador: "Negocios usados / Total permitidos"
- ➕ Botón "Crear negocio" (si no alcanzaste el límite)
- 🗂️ Grid con todos tus negocios
- ✏️ Editar/Eliminar cada negocio

**Crear Negocio:**
1. Click en "Nuevo negocio"
2. Completa información:
   - Nombre (obligatorio)
   - Descripción
   - Categoría
   - Dirección
   - Teléfono/WhatsApp
   - Logo
   - Galería de imágenes
3. Click en "Crear negocio"

---

## 🎨 Características Visuales

### Efectos Interactivos
- **Hover en tarjetas:** Elevación con sombra
- **Botones:** Escalado suave al hacer click
- **Imágenes:** Zoom al pasar el mouse
- **Filtros:** Selección visual con color

### Animaciones
- Aparición suave de elementos
- Transiciones fluidas
- Loading spinners elegantes
- Efectos de gradiente

### Responsividad
- 📱 **Móvil:** Vista optimizada, filtros con botón flotante
- 💻 **Tablet:** 2 columnas, sidebar de filtros visible
- 🖥️ **Desktop:** 3 columnas, layout completo
- 🖥️ **XL:** Espaciado máximo, todo visible

---

## 🔐 Permisos y Restricciones

### Matriz de Permisos

| Acción | Persona | Empresa |
|--------|---------|---------|
| Ver feed público | ✅ | ✅ |
| Crear negocios | ❌ | ✅ (max 5) |
| Editar negocios | ❌ | ✅ (solo propios) |
| Eliminar negocios | ❌ | ✅ (solo propios) |
| Filtrar/Buscar | ✅ | ✅ |
| Contactar WhatsApp | ✅ | ✅ |

---

## 🎯 Casos de Uso

### Caso 1: Soy una persona buscando un restaurante
1. Registro como "Persona"
2. Inicio sesión
3. En el feed, filtro por categoría "Restaurantes"
4. Filtro por mi ubicación "Ciudad XYZ"
5. Veo los resultados
6. Click en WhatsApp del restaurante que me interesa

### Caso 2: Soy dueño de una panadería
1. Registro como "Empresa"
2. Inicio sesión
3. Click en "Nuevo negocio"
4. Completo información:
   - Nombre: "Panadería El Sol"
   - Categoría: "Restaurantes" o "Tiendas"
   - Dirección: Mi dirección
   - WhatsApp: Mi número
   - Subo logo y fotos
5. Click en "Crear negocio"
6. Mi negocio aparece en el feed público

### Caso 3: Tengo varios negocios
1. Registro como "Empresa"
2. Creo mi primer negocio
3. Veo en el dashboard: "1/5 negocios"
4. Click en "Nuevo negocio" nuevamente
5. Creo hasta 5 negocios diferentes
6. Los gestiono todos desde mi dashboard

---

## 💡 Tips y Trucos

### Para Personas:
- 🔍 Usa la búsqueda para encontrar negocios específicos
- 📍 Filtra por ubicación para ver negocios cerca
- 📅 Revisa los eventos destacados regularmente
- ⭐ Los negocios con badge "Nuevo" son recientes

### Para Empresas:
- 📸 Sube imágenes de buena calidad en la galería
- 📝 Escribe descripciones atractivas y completas
- 📞 Asegúrate de poner bien tu WhatsApp
- 🏷️ Elige la categoría correcta para mejor visibilidad
- ✏️ Actualiza tu información regularmente

---

## 🐛 Solución de Problemas

### No puedo crear más negocios
**Causa:** Has alcanzado el límite de 5 negocios
**Solución:** Elimina un negocio existente o contacta soporte para aumentar límite

### No veo la opción "Crear negocio"
**Causa:** Tu cuenta es tipo "Persona"
**Solución:** Las personas no pueden crear negocios, solo explorar

### Los filtros no funcionan
**Causa:** Puede ser problema de conexión a base de datos
**Solución:** Recarga la página, verifica tu conexión

### Las imágenes no se suben
**Causa:** Problema con storage de Supabase
**Solución:** Verifica que los buckets `logos` y `negocios-gallery` existan y sean públicos

---

## 📞 Contacto y Soporte

Para reportar bugs o sugerir mejoras:
- 📧 Email: [tu-email@ejemplo.com]
- 🐛 Issues: [GitHub Issues]
- 📖 Docs completas: Ver `SISTEMA_USUARIOS_FEED.md`

---

## 🎉 ¡Disfruta de Encuentra!

Ya tienes todo listo para usar el sistema completo. Explora, crea y conecta con negocios de tu comunidad.

**¡Buena suerte! 🚀**




