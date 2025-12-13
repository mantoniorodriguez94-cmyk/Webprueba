# Fix: Error {} después de login - business_saves RLS

## 🔴 Problema Identificado

**Error:** `Error verificando si está guardado: {}`

**Ubicación:** `src/lib/analytics.ts` - función `checkBusinessSaved()`

**Causa raíz:**
1. La función usa `.single()` que falla cuando no hay registros
2. RLS puede estar bloqueando la consulta, devolviendo errores vacíos `{}`
3. Falta manejo robusto para el caso "no encontrado"

## ✅ Soluciones Implementadas

### 1. Cambio de `.single()` a `.maybeSingle()`

**Archivo:** `src/lib/analytics.ts`

**Antes:**
```typescript
.single()  // ❌ Falla cuando no hay registro
```

**Después:**
```typescript
.maybeSingle()  // ✅ Devuelve null cuando no hay registro (sin error)
```

**Beneficios:**
- No genera error cuando el negocio no está guardado
- Maneja correctamente el caso "no encontrado"
- Evita errores silenciosos `{}`

### 2. Script SQL para Corregir RLS

**Archivo:** `scripts/fix-business-saves-rls.sql`

Este script:
- ✅ Verifica el estado actual de RLS
- ✅ Elimina políticas existentes (si hay conflictos)
- ✅ Crea políticas correctas para:
  - **SELECT**: Usuarios pueden ver sus propios guardados
  - **INSERT**: Usuarios autenticados pueden guardar
  - **DELETE**: Usuarios pueden eliminar sus guardados
  - **SELECT (dueños)**: Dueños pueden ver quién guardó su negocio
  - **SELECT (admins)**: Admins pueden ver todos los guardados

## 📋 Pasos para Aplicar el Fix

### Paso 1: Ejecutar Script SQL

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `scripts/fix-business-saves-rls.sql`
3. Ejecuta el script
4. Verifica que aparezcan al menos 3 políticas:
   - `Users can view their own saves` (SELECT)
   - `Authenticated users can save businesses` (INSERT)
   - `Users can delete their own saves` (DELETE)

### Paso 2: Verificar Código

El código ya está actualizado:
- ✅ `checkBusinessSaved()` usa `.maybeSingle()`
- ✅ `toggleBusinessSave()` usa `.maybeSingle()`
- ✅ Manejo de errores mejorado

### Paso 3: Validar el Fix

**Prueba 1: Usuario NO logueado**
- ✅ No debe aparecer error en consola
- ✅ `checkBusinessSaved()` debe retornar `false` silenciosamente

**Prueba 2: Usuario logueado - Negocio NO guardado**
- ✅ No debe aparecer error `{}` en consola
- ✅ `checkBusinessSaved()` debe retornar `false`
- ✅ No debe haber errores de RLS

**Prueba 3: Usuario logueado - Negocio guardado**
- ✅ `checkBusinessSaved()` debe retornar `true`
- ✅ No debe haber errores

**Prueba 4: Guardar/Desguardar negocio**
- ✅ Debe funcionar correctamente
- ✅ No debe haber errores de RLS

## 🔍 Políticas RLS Creadas

### SELECT - Usuarios ven sus propios guardados
```sql
CREATE POLICY "Users can view their own saves"
  ON public.business_saves
  FOR SELECT
  USING (auth.uid() = user_id);
```

### INSERT - Usuarios autenticados pueden guardar
```sql
CREATE POLICY "Authenticated users can save businesses"
  ON public.business_saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### DELETE - Usuarios pueden eliminar sus guardados
```sql
CREATE POLICY "Users can delete their own saves"
  ON public.business_saves
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 📁 Archivos Modificados

1. **src/lib/analytics.ts**
   - Cambio de `.single()` a `.maybeSingle()` en `checkBusinessSaved()`
   - Cambio de `.single()` a `.maybeSingle()` en `toggleBusinessSave()`
   - Mejora en manejo de errores

2. **scripts/fix-business-saves-rls.sql** (NUEVO)
   - Script completo para corregir políticas RLS

## ✅ Estado Final Esperado

- ✅ No más errores `{}` en consola después de login
- ✅ `checkBusinessSaved()` funciona correctamente
- ✅ RLS correctamente configurado
- ✅ Usuarios pueden verificar si guardaron un negocio sin errores
- ✅ Usuarios pueden guardar/desguardar negocios sin problemas

## 🚨 Si el Problema Persiste

1. Verifica que el script SQL se ejecutó correctamente
2. Revisa los logs del servidor para ver errores específicos
3. Verifica que `auth.uid()` esté disponible en el contexto de la consulta
4. Asegúrate de que el usuario esté correctamente autenticado

