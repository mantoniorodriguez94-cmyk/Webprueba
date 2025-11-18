# 🔧 Solución: Los Negocios No Aparecen en el Sitio Web

## 🎯 Problema Identificado

Los 10 negocios modelo no aparecen en el sitio web porque:

1. ❌ La tabla `businesses` probablemente no existe en tu base de datos de Supabase
2. ❌ O si existe, las políticas RLS (Row Level Security) están bloqueando la visualización
3. ❌ O falta ejecutar el script de seed que inserta los 10 negocios

## ✅ Solución Completa - Sigue estos pasos en orden:

---

### 📋 **PASO 1: Crear la Tabla Businesses**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com)
2. Haz clic en **SQL Editor** en el menú lateral izquierdo
3. Haz clic en **"New Query"** (arriba a la derecha)
4. Copia **TODO** el contenido del archivo: `scripts/create-businesses-table.sql`
5. Pégalo en el editor SQL
6. Haz clic en **"Run"** o presiona `Ctrl + Enter`

**✅ Resultado esperado:**
```
✅ Tabla businesses creada exitosamente con políticas RLS
📝 Siguiente paso: Ejecuta scripts/seed-businesses.sql para agregar los 10 negocios modelo
```

Si ves este mensaje, ¡perfecto! Continúa al siguiente paso.

**⚠️ Si hay error:**
- Si dice que la tabla ya existe, está bien, continúa al siguiente paso
- Si hay error de permisos, asegúrate de estar logueado en Supabase Dashboard

---

### 📋 **PASO 2: Insertar los 10 Negocios Modelo**

1. En el mismo **SQL Editor** de Supabase
2. Crea otra **"New Query"**
3. Copia **TODO** el contenido del archivo: `scripts/seed-businesses.sql`
4. Pégalo en el editor SQL
5. Haz clic en **"Run"** o presiona `Ctrl + Enter`

**✅ Resultado esperado:**
```
✅ Se insertaron 10 negocios modelo exitosamente
```

Y verás una tabla con los 10 negocios listados:
- ☕ Café Aromas del Valle
- 💻 TechFix Reparaciones
- 🏋️ Gimnasio FitZone
- 👗 Boutique Elegancia
- 🍽️ Restaurante El Sabor Costeño
- 💆 Spa & Belleza Serenity
- 📚 Librería & Papelería CreArte
- 🐕 Veterinaria Amigos Peludos
- 🔧 Taller Mecánico AutoExpress
- 🎭 Cine-Teatro Cultural Centro

**⚠️ Si hay error:**
- Si dice "duplicate key value", es que ya están insertados, continúa al siguiente paso
- Si dice "owner_id no existe", el script automáticamente usa un ID temporal (está bien)

---

### 📋 **PASO 3: Verificar los Negocios en Supabase**

1. En Supabase Dashboard, ve a **Table Editor** (menú lateral)
2. Busca y selecciona la tabla **`businesses`**
3. Deberías ver los 10 negocios con todos sus datos:
   - ✅ name (nombre)
   - ✅ description (descripción)
   - ✅ category (categoría)
   - ✅ address (dirección)
   - ✅ phone y whatsapp
   - ✅ logo_url (URL del logo)
   - ✅ gallery_urls (array de imágenes)

**Si ves los 10 negocios aquí, significa que están correctamente insertados en la base de datos.**

---

### 📋 **PASO 4: Reiniciar el Servidor de Desarrollo**

1. Ve a tu terminal donde corre el servidor Next.js
2. Presiona `Ctrl + C` para detenerlo
3. Ejecuta de nuevo:
   ```bash
   npm run dev
   ```

Esto asegura que la aplicación recargue la configuración.

---

### 📋 **PASO 5: Ver los Negocios en el Dashboard**

1. Abre tu navegador en: `http://localhost:3000/app/dashboard`
2. Si no has iniciado sesión, regístrate primero en: `http://localhost:3000/app/auth/register`
3. Una vez en el dashboard, deberías ver:
   - ✅ Los 10 negocios en la pestaña **"Todos"**
   - ✅ Los negocios en la pestaña **"Recientes"** (si fueron creados hace menos de 7 días)
   - ✅ Los primeros 6 en la pestaña **"Destacados"**
   - ✅ Las categorías populares con el conteo de negocios

**🎉 Si ves los negocios aquí, ¡todo está funcionando correctamente!**

---

## 🚀 Nueva Funcionalidad: Botón "Probar Gratis"

**✅ YA IMPLEMENTADO** - El botón "Probar gratis" en la página de inicio ahora redirige automáticamente a la página de registro (`/app/auth/register`) cuando haces clic en él.

Para probarlo:
1. Ve a `http://localhost:3000` (página de inicio)
2. Haz clic en el botón azul **"Probar gratis"**
3. Deberías ser redirigido a la página de registro

---

## 🔍 Verificación Final - Checklist Completo

Marca cada punto cuando lo hayas completado:

### En Supabase:
- [ ] Tabla `businesses` existe
- [ ] La tabla tiene 10 registros
- [ ] Los registros tienen logo_url y gallery_urls con URLs de Unsplash
- [ ] Las políticas RLS están habilitadas (puedes ver "RLS enabled" en Table Editor)

### En el Dashboard:
- [ ] `http://localhost:3000/app/dashboard` muestra los negocios
- [ ] Los logos de los negocios cargan correctamente
- [ ] Puedes hacer clic en "Ver más" y ver los detalles
- [ ] Los filtros por categoría funcionan
- [ ] La búsqueda por texto funciona

### En la Página de Inicio:
- [ ] `http://localhost:3000` carga correctamente
- [ ] El botón "Probar gratis" redirige a `/app/auth/register`

---

## 🐛 Solución de Problemas Comunes

### Problema 1: "No veo los negocios en el dashboard"

**Causas posibles:**
1. La tabla no existe → Ejecuta `create-businesses-table.sql`
2. Los datos no están insertados → Ejecuta `seed-businesses.sql`
3. Las políticas RLS bloquean la visualización → Verifica que la política "Anyone can view businesses" existe

**Solución:**
```sql
-- Ejecuta esto en SQL Editor para verificar las políticas:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'businesses';

-- Deberías ver una política llamada "Anyone can view businesses" con cmd = "SELECT"
```

### Problema 2: "Las imágenes no cargan"

**Causa:** Las URLs de Unsplash están bloqueadas por Next.js

**Solución:** Ya está configurado en `next.config.ts`, pero si persiste:
1. Detén el servidor (Ctrl+C)
2. Elimina la carpeta `.next` (caché de Next.js)
3. Ejecuta `npm run dev` de nuevo

### Problema 3: "Error: owner_id no existe"

**Causa:** No hay usuarios registrados en auth.users

**Solución:** El script automáticamente usa un ID temporal. Los negocios seguirán siendo visibles en el feed público. Si quieres, puedes:
1. Registrarte en `/app/auth/register`
2. Volver a ejecutar el script `seed-businesses.sql`

### Problema 4: "Error: duplicate key value"

**Causa:** Los negocios ya están insertados

**Solución:** No es un error real. Los negocios ya existen. Verifica en Table Editor que estén ahí.

Si quieres reinsertar, primero elimínalos:
```sql
-- ⚠️ Solo si quieres eliminar los negocios existentes:
DELETE FROM businesses WHERE name IN (
  'Café Aromas del Valle',
  'TechFix Reparaciones',
  'Gimnasio FitZone',
  'Boutique Elegancia',
  'Restaurante El Sabor Costeño',
  'Spa & Belleza Serenity',
  'Librería & Papelería CreArte',
  'Veterinaria Amigos Peludos',
  'Taller Mecánico AutoExpress',
  'Cine-Teatro Cultural Centro'
);
```

Luego ejecuta `seed-businesses.sql` de nuevo.

---

## 📊 Verificar que Todo Funciona al 100%

Ejecuta este SQL en Supabase para verificar todo:

```sql
-- 1. Verificar que la tabla existe y tiene la estructura correcta
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
ORDER BY ordinal_position;

-- 2. Contar los negocios insertados
SELECT COUNT(*) as total_negocios FROM businesses;

-- 3. Ver todos los negocios con sus datos principales
SELECT 
  id,
  name,
  category,
  address,
  logo_url IS NOT NULL as tiene_logo,
  array_length(gallery_urls, 1) as cantidad_fotos
FROM businesses
ORDER BY created_at DESC;

-- 4. Verificar las políticas RLS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'businesses';
```

**Resultados esperados:**
1. Deberías ver todas las columnas de la tabla
2. `total_negocios` debería ser **10**
3. Todos los negocios deberían tener `tiene_logo = true` y `cantidad_fotos >= 2`
4. Deberías ver 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)

---

## 🎯 Resultado Final Esperado

Cuando todo esté configurado correctamente:

### En el Dashboard (`/app/dashboard`):
- ✅ Ves 10 tarjetas de negocios con logos e información
- ✅ Cada tarjeta tiene botones "Contactar" (WhatsApp) y "Ver más"
- ✅ Las galerías de fotos funcionan
- ✅ Los filtros por categoría muestran/ocultan negocios
- ✅ La búsqueda por texto funciona
- ✅ Las pestañas "Todos", "Recientes" y "Destacados" funcionan

### En la Página de Inicio (`/`):
- ✅ El botón "Probar gratis" redirige a `/app/auth/register`
- ✅ Los 4 negocios estáticos se muestran correctamente
- ✅ El carrusel animado funciona

---

## 📞 ¿Aún No Funciona?

Si después de seguir todos los pasos aún no funciona:

1. **Revisa la consola del navegador:**
   - Presiona F12
   - Ve a la pestaña "Console"
   - Busca errores en rojo

2. **Revisa la terminal del servidor:**
   - Mira si hay errores cuando accedes al dashboard

3. **Verifica las variables de entorno:**
   - Archivo: `.env.local`
   - Debe contener:
     ```
     NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
     ```

4. **Verifica la conexión a Supabase:**
   ```javascript
   // Prueba en la consola del navegador:
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   // Debería mostrar tu URL de Supabase
   ```

---

## 📝 Resumen de Archivos Creados/Modificados

### ✅ Archivos Nuevos:
1. `scripts/create-businesses-table.sql` - Crea la tabla y políticas RLS
2. `SOLUCION_NEGOCIOS_NO_APARECEN.md` - Este documento

### ✅ Archivos Modificados:
1. `src/app/page.tsx` - Botón "Probar gratis" ahora redirige a registro

### ✅ Archivos Existentes (sin cambios):
1. `scripts/seed-businesses.sql` - Script para insertar los 10 negocios
2. `next.config.ts` - Ya tenía la configuración correcta para Unsplash
3. `supabase-setup.sql` - Configuración de perfiles y usuarios

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu aplicación ahora debería estar funcionando al **100%** con:
- ✅ 10 negocios modelo visibles en el dashboard
- ✅ Todas las funcionalidades operativas
- ✅ Botón "Probar gratis" redirigiendo a registro
- ✅ Imágenes de Unsplash cargando correctamente
- ✅ Filtros y búsqueda funcionando
- ✅ Políticas RLS configuradas correctamente

**¡Felicidades! Tu plataforma Encuentra está lista para usar.** 🚀

---

*Última actualización: 18 de noviembre de 2025*

