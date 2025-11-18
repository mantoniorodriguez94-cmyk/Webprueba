# 🎉 Cómo Agregar los 10 Negocios Modelo

## 📝 Resumen

He creado 10 negocios modelo con datos realistas, diferentes categorías, ubicaciones variadas en Colombia, y fotos representativas gratuitas de Unsplash. Estos negocios aparecerán en tu dashboard principal para que puedas ver cómo luce el portal.

---

## 🚀 Pasos para Insertar los Negocios

### Opción 1: Ejecutar SQL en Supabase (Recomendado) ⭐

Este es el método más sencillo y confiable:

1. **Abre Supabase Dashboard**
   - Ve a [https://supabase.com](https://supabase.com)
   - Inicia sesión en tu cuenta
   - Selecciona tu proyecto "encuentra"

2. **Ve al SQL Editor**
   - En el menú lateral izquierdo, busca y haz clic en **"SQL Editor"**
   - Haz clic en el botón **"New Query"** (arriba a la derecha)

3. **Copia el Script SQL**
   - Abre el archivo: `scripts/seed-businesses.sql`
   - Copia todo su contenido (Ctrl+A, Ctrl+C)

4. **Pega y Ejecuta**
   - Pega el contenido en el editor SQL de Supabase
   - Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)

5. **Verifica el Resultado**
   - Deberías ver un mensaje: "✅ Se insertaron 10 negocios modelo exitosamente"
   - Más abajo verás una tabla con los 10 negocios listados

6. **¡Listo!** 🎊
   - Ve a tu aplicación: `http://localhost:3000/app/dashboard`
   - Los 10 negocios modelo deberían aparecer en el feed principal

---

## 📦 Los 10 Negocios Modelo Incluyen:

| # | Nombre | Categoría | Ciudad |
|---|--------|-----------|--------|
| 1 | ☕ Café Aromas del Valle | Restaurantes | Bogotá |
| 2 | 💻 TechFix Reparaciones | Tecnología | Medellín |
| 3 | 🏋️ Gimnasio FitZone | Deportes | Bogotá |
| 4 | 👗 Boutique Elegancia | Tiendas | Bogotá |
| 5 | 🍽️ Restaurante El Sabor Costeño | Restaurantes | Barranquilla |
| 6 | 💆 Spa & Belleza Serenity | Belleza | Bogotá |
| 7 | 📚 Librería & Papelería CreArte | Educación | Cali |
| 8 | 🐕 Veterinaria Amigos Peludos | Salud | Medellín |
| 9 | 🔧 Taller Mecánico AutoExpress | Servicios | Bogotá |
| 10 | 🎭 Cine-Teatro Cultural Centro | Entretenimiento | Cartagena |

Cada negocio incluye:
- ✅ Nombre y descripción detallada
- ✅ Categoría y dirección completa
- ✅ Teléfono y WhatsApp
- ✅ Logo representativo (foto de Unsplash)
- ✅ Galería de 2-3 imágenes profesionales

---

## 🔧 Configuración Completada

Ya he actualizado automáticamente:

1. ✅ **next.config.ts** - Configurado para cargar imágenes de Unsplash
2. ✅ **scripts/seed-businesses.sql** - Script SQL listo para ejecutar
3. ✅ **scripts/seed-businesses.js** - Script Node.js (alternativo, tiene limitaciones)
4. ✅ **scripts/README.md** - Documentación detallada de los scripts

---

## 🖼️ Sobre las Imágenes

Todas las fotos son de **Unsplash**, un servicio de imágenes de alta calidad gratuitas para uso comercial:

- **Logos**: 400x400 píxeles (optimizados para carga rápida)
- **Galería**: 800x600 píxeles (alta calidad para visualización)
- **Representativas**: Cada foto fue seleccionada para representar fielmente el tipo de negocio

---

## 🎨 Cómo se Verá en el Dashboard

Los negocios aparecerán en el feed principal con:

- **Tarjetas visuales** con logo y foto principal
- **Información completa**: nombre, descripción, categoría
- **Ubicación** con dirección
- **Botones de contacto**: teléfono y WhatsApp
- **Galería de fotos** en vista detallada

También aparecerán en:
- ✅ Pestaña **"Todos"** - Feed completo
- ✅ Pestaña **"Recientes"** - Como negocios nuevos
- ✅ Pestaña **"Destacados"** - Los primeros 6
- ✅ **Categorías Populares** - Organizados por tipo
- ✅ **Filtros** - Podrás buscarlos por categoría y ubicación

---

## 🐛 Solución de Problemas

### Problema 1: "Las imágenes no cargan"

**Solución:**
- Ya actualicé `next.config.ts` para permitir imágenes de Unsplash
- Si aún así no cargan, reinicia el servidor de desarrollo:
  ```bash
  # Detén el servidor (Ctrl+C)
  npm run dev
  ```

### Problema 2: "Error de Row Level Security"

**Solución:**
- Usa el script SQL (`seed-businesses.sql`) en Supabase Dashboard
- Este script tiene los privilegios necesarios para insertar los datos

### Problema 3: "No veo los negocios en el dashboard"

**Verificación:**
1. Refresca la página del dashboard (F5)
2. Verifica en Supabase > Table Editor > businesses que los datos estén ahí
3. Verifica que estés en la pestaña correcta (Feed/Todos)

### Problema 4: "owner_id no existe"

**Solución:**
- El script automáticamente busca un usuario existente
- Si no encuentra ninguno, usa un ID temporal
- Los negocios seguirán siendo visibles en el feed público

---

## 📊 Verificar que Todo Funcione

Después de ejecutar el script, verifica:

1. ✅ **En Supabase Dashboard**:
   - Ve a **Table Editor** > `businesses`
   - Deberías ver 10 negocios nuevos

2. ✅ **En el Dashboard**:
   - Abre: `http://localhost:3000/app/dashboard`
   - Verifica que aparezcan los 10 negocios
   - Prueba los filtros por categoría
   - Haz clic en un negocio para ver los detalles y galería

3. ✅ **Funcionalidad**:
   - Las imágenes deben cargar correctamente
   - Los botones de WhatsApp y teléfono deben funcionar
   - Los filtros deben mostrar/ocultar negocios correctamente

---

## 🎯 Siguiente Paso

Una vez que hayas ejecutado el script SQL y veas los negocios en el dashboard, el portal estará completamente funcional y podrás:

- 📱 Ver cómo luce el portal con datos reales
- 🔍 Probar los filtros y búsquedas
- 👀 Evaluar el diseño y la UX
- 🚀 Hacer ajustes según lo que veas

---

## 💡 Notas Adicionales

- **Los negocios son de demostración**: Puedes modificarlos o eliminarlos cuando quieras
- **Datos ficticios**: Los números de teléfono y WhatsApp son inventados
- **Fotos reales**: Las imágenes son reales y de alta calidad
- **Fácil de personalizar**: Puedes editar el SQL para cambiar cualquier dato

---

¿Tienes preguntas? Revisa el archivo `scripts/README.md` para más detalles técnicos.




