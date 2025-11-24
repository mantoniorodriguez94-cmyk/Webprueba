# 🚀 Guía de Configuración: Reviews y Estadísticas

## ⚡ Configuración en 3 Pasos (5 minutos)

### Paso 1: Ejecutar el Script SQL en Supabase

1. **Abre tu proyecto en Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Ve al SQL Editor**
   ```
   Menú lateral → SQL Editor → New Query
   ```

3. **Copia y pega el script completo**
   ```
   Abre: scripts/setup-completo-reviews-y-estadisticas.sql
   Selecciona TODO el contenido (Ctrl+A)
   Copia (Ctrl+C)
   Pega en Supabase SQL Editor (Ctrl+V)
   ```

4. **Ejecuta el script**
   ```
   Click en el botón "RUN" (o F5)
   Espera 5-10 segundos
   ```

5. **Verifica que funcionó**
   ```
   Deberías ver mensajes como:
   ✅ Sistema de Reviews instalado correctamente
   ✅ Sistema de Analytics instalado correctamente
   📊 Tablas creadas: reviews, business_views, business_saves, business_interactions
   🎉 Todo listo!
   ```

### Paso 2: Verificar las Tablas

Ejecuta esta consulta en el SQL Editor:

```sql
-- Verifica que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reviews', 'business_views', 'business_saves', 'business_interactions')
ORDER BY table_name;
```

**Deberías ver 4 tablas:**
- ✅ business_interactions
- ✅ business_saves
- ✅ business_views
- ✅ reviews

### Paso 3: Probar en el Portal

1. **Reinicia tu servidor de desarrollo**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

2. **Abre el portal en tu navegador**
   ```
   http://localhost:3000/app/dashboard
   ```

3. **Prueba las Reviews**
   ```
   a. Click en cualquier negocio
   b. Scroll hasta "Reseñas y Calificaciones"
   c. Click en "Dejar una reseña"
   d. Selecciona 5 estrellas
   e. Escribe: "Excelente servicio, muy recomendado"
   f. Click "Publicar reseña"
   g. ✅ Deberías ver: "🌟 ¡Reseña publicada!"
   ```

4. **Prueba las Estadísticas**
   ```
   a. Abre un negocio → Se registra 1 vista
   b. Ve a "Mis Negocios" si eres empresa
   c. Click en "Estadísticas" de tu negocio
   d. ✅ Deberías ver las vistas registradas
   ```

## 🔍 Solución de Problemas

### Problema 1: "Error al crear la reseña"

**Síntomas:**
```
Al publicar review aparece error en rojo
Console muestra: "relation 'reviews' does not exist"
```

**Solución:**
```bash
1. ¿Ejecutaste el script SQL? → Si NO, ejecuta Paso 1
2. ¿Viste mensaje de éxito? → Si NO, verifica errores en Supabase
3. ¿Reiniciaste el servidor? → npm run dev de nuevo
```

### Problema 2: "Las estadísticas no se registran"

**Síntomas:**
```
Abro negocio pero las vistas no aumentan
En "Estadísticas" muestra 0 vistas
```

**Solución:**
```sql
-- Verifica que la tabla existe
SELECT * FROM public.business_views LIMIT 5;

-- Si da error "does not exist":
-- Ejecuta el script: setup-completo-reviews-y-estadisticas.sql
```

### Problema 3: "No aparece el botón de reseñas"

**Síntomas:**
```
No veo la sección "Reseñas y Calificaciones"
No hay botón "Dejar una reseña"
```

**Verifica:**
```
✓ ¿Estás en un negocio específico? (/app/dashboard/negocios/[id])
✓ ¿Estás logueado como usuario?
✓ ¿NO eres el dueño del negocio? (no puedes hacer review de tu negocio)
```

### Problema 4: "⚠️ El sistema de reviews no está configurado"

**Causa:**
```
Las tablas de la base de datos no existen
```

**Solución RÁPIDA:**
```bash
1. Ve a Supabase Dashboard
2. SQL Editor → New Query
3. Ejecuta: scripts/setup-completo-reviews-y-estadisticas.sql
4. Refresca tu navegador
5. ✅ Listo!
```

## 📊 Verificar que Todo Funciona

### Checklist Completo:

```bash
□ Ejecuté el script SQL en Supabase
□ Vi mensaje "✅ Sistema instalado correctamente"
□ Verifiqué que existen 4 tablas nuevas
□ Reinicié el servidor (npm run dev)
□ Puedo ver la sección de reseñas en negocios
□ Puedo publicar una reseña exitosamente
□ La reseña aparece inmediatamente después de publicar
□ Las estadísticas se actualizan automáticamente
□ Puedo ver las vistas en el panel de estadísticas
```

## 🎯 Pruebas Completas

### Test 1: Publicar una Reseña
```
1. Abre cualquier negocio (que NO sea tuyo)
2. Click "Dejar una reseña"
3. Selecciona 5 estrellas ⭐⭐⭐⭐⭐
4. Escribe: "Excelente servicio"
5. Click "Publicar reseña"
6. ✅ Debe aparecer mensaje de éxito
7. ✅ La reseña debe verse inmediatamente
```

### Test 2: Editar una Reseña
```
1. Ve al mismo negocio donde publicaste
2. Click "Editar mi reseña"
3. Cambia a 4 estrellas
4. Modifica el comentario
5. Click "Actualizar reseña"
6. ✅ Debe actualizarse inmediatamente
```

### Test 3: Ver Estadísticas
```
1. Ve a "Mis Negocios" (si eres empresa)
2. Abre uno de tus negocios
3. Click en "Estadísticas" en el menú
4. ✅ Deberías ver:
   - Total de vistas
   - Vistas últimos 7 días
   - Vistas últimos 30 días
   - Interacciones
```

### Test 4: Ver Reviews en el Feed
```
1. Ve al feed principal (/app/dashboard)
2. Busca el negocio donde dejaste review
3. ✅ Deberías ver:
   - Estrellas al lado de la categoría
   - "4.5 (1)" indicando rating y cantidad
```

## 📈 Monitoreo

### Consultas Útiles en Supabase:

```sql
-- Ver todas las reviews
SELECT 
  r.*,
  b.name as business_name,
  u.email as user_email
FROM reviews r
JOIN businesses b ON r.business_id = b.id
LEFT JOIN auth.users u ON r.user_id = u.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Ver estadísticas de un negocio específico
SELECT * FROM business_review_stats 
WHERE business_id = 'TU_BUSINESS_ID_AQUI';

-- Ver vistas de negocios
SELECT 
  b.name,
  COUNT(*) as total_views
FROM business_views bv
JOIN businesses b ON bv.business_id = b.id
GROUP BY b.id, b.name
ORDER BY total_views DESC;

-- Ver las reviews más recientes
SELECT 
  b.name as negocio,
  r.rating as estrellas,
  r.comment as comentario,
  r.created_at as fecha
FROM reviews r
JOIN businesses b ON r.business_id = b.id
ORDER BY r.created_at DESC
LIMIT 5;
```

## 🎉 Confirmación Final

Si completaste todos los pasos, deberías tener:

### ✅ Sistema de Reviews:
- [x] Usuarios pueden dejar reseñas
- [x] Usuarios pueden editar sus reseñas
- [x] Las reseñas se muestran con avatar y fecha
- [x] Estadísticas de rating se calculan automáticamente
- [x] Las estrellas aparecen en el feed principal
- [x] Las estrellas aparecen en las tarjetas de negocios

### ✅ Sistema de Estadísticas:
- [x] Se registran vistas al abrir un negocio
- [x] Se registran clicks en botones (WhatsApp, teléfono, etc.)
- [x] Los dueños pueden ver estadísticas de su negocio
- [x] Las vistas se limitan a 1 por usuario por día
- [x] Dashboard de analytics funcional

## 🆘 Soporte

### Si nada funciona:

1. **Revisa la consola del navegador (F12)**
   ```
   Busca errores en rojo
   Copia el mensaje de error
   ```

2. **Revisa los logs de Supabase**
   ```
   Supabase Dashboard → Logs → Postgres Logs
   Busca errores recientes
   ```

3. **Verifica las políticas RLS**
   ```sql
   -- Ver políticas de reviews
   SELECT * FROM pg_policies WHERE tablename = 'reviews';
   
   -- Ver políticas de business_views
   SELECT * FROM pg_policies WHERE tablename = 'business_views';
   ```

4. **Re-ejecuta el script completo**
   ```
   Si todo lo demás falla, ejecuta de nuevo:
   scripts/setup-completo-reviews-y-estadisticas.sql
   ```

## 📞 Siguiente Paso

Una vez que todo funcione:
1. Prueba con diferentes usuarios
2. Deja varias reseñas de prueba
3. Verifica las estadísticas
4. **¡Comparte tu portal con usuarios reales!** 🚀

---

**¿Todo funcionando?** ✅ ¡Perfecto! Tu sistema de reviews y estadísticas está 100% operativo.




