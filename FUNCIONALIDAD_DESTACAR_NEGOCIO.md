# Funcionalidad de Destacar Negocio - Documentación

## 📋 Resumen

Se ha implementado una funcionalidad completa para que los administradores puedan destacar negocios manualmente. Los negocios destacados aparecerán exclusivamente en la sección de "Destacados" del dashboard por un tiempo determinado (en días).

## ✨ Características Implementadas

1. **Modal para Destacar Negocio**: Similar al modal de "+ Fotos", permite ingresar el número de días que el negocio estará destacado (1-365 días).
2. **API de Destacar**: Actualiza `is_featured = true` y calcula `featured_until` basado en los días ingresados.
3. **Filtrado de Destacados**: La sección "Destacados" ahora solo muestra negocios manualmente destacados (excluye negocios premium).
4. **Campo `featured_until`**: Nuevo campo en la tabla `businesses` para controlar la fecha de expiración del destacado.

## 🗄️ Cambios en la Base de Datos

### Script SQL Requerido

**IMPORTANTE**: Antes de usar la funcionalidad, ejecuta el siguiente script en Supabase:

```sql
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- Archivo: scripts/add-featured-until-field.sql
```

El script:
- Agrega el campo `featured_until TIMESTAMPTZ` a la tabla `businesses`
- Crea un índice para búsquedas eficientes de destacados activos

## 🔧 Archivos Modificados

### Nuevos Archivos
1. **`src/app/app/admin/components/FeaturedDaysModal.tsx`**
   - Modal para ingresar días de destacado
   - Muestra fecha estimada de expiración
   - Valida entrada (1-365 días)

2. **`scripts/add-featured-until-field.sql`**
   - Script SQL para agregar campo `featured_until`

### Archivos Modificados
1. **`src/app/api/admin/business/destacar/route.ts`**
   - Ahora acepta parámetro `days` en el body
   - Calcula `featured_until` basado en los días ingresados
   - Solo actualiza campos de destacado (no toca premium ni profiles)

2. **`src/app/app/admin/components/AdminActionButton.tsx`**
   - Integra `FeaturedDaysModal` para tipo "destacar"
   - Abre modal cuando se hace clic en "Destacar"

3. **`src/app/app/dashboard/page.tsx`**
   - Lógica de filtrado de destacados completamente reescrita
   - Solo muestra negocios con `is_featured = true` y `featured_until > NOW()`
   - Excluye completamente los negocios premium de la sección destacados

4. **`src/types/business.ts`**
   - Agregado campo `featured_until?: string | null` al tipo `Business`

## 📝 Cómo Usar

### Para Administradores

1. **Destacar un Negocio**:
   - Ve a `/app/admin/negocios`
   - Haz clic en un negocio para ver sus detalles
   - Haz clic en el botón "Destacar"
   - Ingresa el número de días (1-365)
   - El modal mostrará la fecha estimada de expiración
   - Confirma para destacar el negocio

2. **Ver Negocios Destacados**:
   - Ve a `/app/dashboard`
   - Haz clic en la pestaña "Destacados"
   - Solo verás negocios manualmente destacados por administradores

### Validación

- ✅ Solo acepta números entre 1 y 365
- ✅ Calcula automáticamente `featured_until`
- ✅ Los negocios premium NO aparecen en destacados
- ✅ Los destacados expiran automáticamente cuando `featured_until` pasa

## 🔒 Seguridad

- ✅ Solo administradores pueden destacar negocios
- ✅ La API valida permisos de administrador
- ✅ No se modifican campos de premium ni profiles
- ✅ Solo se actualizan `is_featured` y `featured_until`

## ⚠️ Notas Importantes

1. **Ejecutar Script SQL Primero**: Es CRÍTICO ejecutar el script SQL antes de usar la funcionalidad, de lo contrario la API fallará.

2. **Negocios Premium Excluidos**: Los negocios premium ya NO aparecen en la sección "Destacados". Solo aparecen negocios destacados manualmente.

3. **Expiración Automática**: 
   - Los negocios dejan de aparecer en destacados automáticamente cuando `featured_until` expira
   - El sistema verifica `featured_until > NOW()` en tiempo real en cada consulta
   - Para mantener la base de datos limpia, configura la limpieza automática diaria (ver `CONFIGURAR_LIMPIEZA_AUTOMATICA.md`)
   - La función `cleanup_expired_premium_and_featured()` actualiza `is_featured = false` cuando expira

4. **Disminución de Días**: Los días disminuyen automáticamente porque se compara la fecha actual con `featured_until`. No necesitas un contador separado - el tiempo restante se calcula dinámicamente (ej: si `featured_until = 31 enero` y hoy es `15 enero`, quedan 16 días automáticamente).

5. **Sin Botón de Quitar Destacado**: Actualmente no hay un botón para quitar el destacado antes de que expire. Para quitar manualmente, se debe ejecutar SQL directamente o implementar una funcionalidad adicional.

## 🚀 Pasos para Aplicar

1. **Ejecutar Script SQL**:
   ```bash
   # En Supabase Dashboard > SQL Editor
   # Copiar y pegar el contenido de scripts/add-featured-until-field.sql
   # Ejecutar
   ```

2. **Verificar que el campo existe**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns
   WHERE table_name = 'businesses' 
   AND column_name = 'featured_until';
   ```

3. **Probar la funcionalidad**:
   - Iniciar sesión como administrador
   - Ir a `/app/admin/negocios/[id]`
   - Hacer clic en "Destacar"
   - Ingresar días y confirmar
   - Verificar en `/app/dashboard` pestaña "Destacados"

## 🐛 Troubleshooting

**Error: "Campo featured_until no existe"**
- ✅ Ejecutar el script SQL `add-featured-until-field.sql`

**Error: "days debe ser un número entre 1 y 365"**
- ✅ Verificar que estés enviando un número válido en el body de la petición

**Los negocios premium aún aparecen en destacados**
- ✅ Verificar que se haya actualizado la lógica en `dashboard/page.tsx`
- ✅ Limpiar caché del navegador
- ✅ Verificar que `is_featured = true` y `featured_until > NOW()` en la base de datos

