# 🌱 Scripts de Seed para Encuentra

Este directorio contiene scripts para insertar datos de demostración en tu base de datos.

## 📋 Contenido

### 1. `seed-businesses.sql` ⭐ (RECOMENDADO)

Script SQL para insertar 10 negocios modelo directamente en Supabase.

#### ¿Qué incluye?

- **10 negocios modelo** de diferentes categorías:
  - ☕ Café Aromas del Valle (Restaurantes)
  - 💻 TechFix Reparaciones (Tecnología)
  - 🏋️ Gimnasio FitZone (Deportes)
  - 👗 Boutique Elegancia (Tiendas)
  - 🍽️ Restaurante El Sabor Costeño (Restaurantes)
  - 💆 Spa & Belleza Serenity (Belleza)
  - 📚 Librería & Papelería CreArte (Educación)
  - 🐕 Veterinaria Amigos Peludos (Salud)
  - 🔧 Taller Mecánico AutoExpress (Servicios)
  - 🎭 Cine-Teatro Cultural Centro (Entretenimiento)

- **Datos completos** para cada negocio:
  - Nombre y descripción detallada
  - Categoría y dirección (ubicaciones en Colombia)
  - Teléfono y WhatsApp
  - Logo representativo (foto de Unsplash)
  - Galería de 2-3 imágenes (fotos de Unsplash)

#### 🚀 Cómo usarlo:

1. **Ve a Supabase Dashboard**
   - Abre tu proyecto en [supabase.com](https://supabase.com)
   - Ve a **SQL Editor** en el menú lateral

2. **Crea una nueva consulta**
   - Click en **"New Query"**

3. **Copia y pega el contenido del archivo** `seed-businesses.sql`

4. **Ejecuta el script**
   - Click en **"Run"** o presiona `Ctrl + Enter`

5. **Verifica los resultados**
   - El script mostrará un mensaje de éxito
   - Verás una tabla con los 10 negocios insertados

6. **Actualiza tu dashboard**
   - Ve a `http://localhost:3000/app/dashboard`
   - ¡Deberías ver los 10 negocios modelo!

---

### 2. `seed-businesses.js`

Script Node.js alternativo (⚠️ tiene problemas con RLS policies).

**Nota:** Este script tiene problemas con las políticas de seguridad de Supabase.
Se recomienda usar el script SQL en su lugar.

---

## 📸 Fuente de Imágenes

Todas las imágenes provienen de [Unsplash](https://unsplash.com/), un servicio de fotos gratuitas de alta calidad. Las URLs de las imágenes incluyen parámetros para optimizar el tamaño:

- Logos: `400x400` píxeles
- Galería: `800x600` píxeles

---

## 🔧 Solución de Problemas

### Problema: "row-level security policy violation"

**Solución:** Usa el script SQL (`seed-businesses.sql`) directamente en Supabase Dashboard. Este script ejecuta con privilegios elevados que evitan las políticas RLS.

### Problema: "No se encontraron usuarios"

**Solución:** El script automáticamente:
1. Busca el primer usuario registrado en tu base de datos
2. Si no encuentra ninguno, usa un ID demo temporal
3. Puedes registrar un usuario primero si prefieres que los negocios tengan un owner real

### Problema: Las imágenes no cargan

**Solución:** 
1. Verifica que tu configuración de `next.config.ts` permita imágenes de Unsplash
2. Agrega este patrón si no está:
   ```typescript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'images.unsplash.com'
       }
     ]
   }
   ```

---

## 🎨 Personalización

Si quieres modificar los negocios modelo:

1. Edita el archivo `seed-businesses.sql`
2. Cambia los valores de:
   - `name`: Nombre del negocio
   - `description`: Descripción
   - `category`: Categoría (Restaurantes, Tecnología, etc.)
   - `address`: Dirección
   - `phone` / `whatsapp`: Números de contacto
   - `logo_url`: URL del logo
   - `gallery_urls`: Array de URLs de imágenes

3. Para buscar nuevas imágenes en Unsplash:
   - Ve a [unsplash.com](https://unsplash.com)
   - Busca el tipo de negocio
   - Copia la URL de la imagen
   - Agrega parámetros: `?w=800&h=600&fit=crop`

---

## ✅ Checklist

- [ ] Tabla `businesses` existe en Supabase
- [ ] Ejecutar script SQL en Supabase Dashboard
- [ ] Verificar que se insertaron 10 negocios
- [ ] Abrir dashboard y ver los negocios
- [ ] (Opcional) Ajustar configuración de imágenes en `next.config.ts`

---

## 📞 Soporte

Si tienes problemas, verifica:
1. ✅ La tabla `businesses` existe en tu base de datos
2. ✅ Las políticas RLS están configuradas correctamente
3. ✅ Tienes al menos un usuario registrado (opcional)
4. ✅ Las variables de entorno están configuradas en `.env.local`





