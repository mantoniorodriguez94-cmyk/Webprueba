# Solución Completa: Pagos Manuales - Botones y Descargas

## Problema Identificado

1. **Error "Pago manual no encontrado"**: Causado por políticas RLS que bloquean las actualizaciones
2. **Botones de descargar/ampliar no aparecen**: Problema con la lógica de condiciones disabled

## Solución Paso a Paso

### Paso 1: Ejecutar Script SQL para Corregir Políticas RLS

Ve al **SQL Editor de Supabase** y ejecuta el script:

```sql
-- Este script está en: scripts/fix-manual-payments-rls.sql
```

O ejecuta directamente este SQL:

```sql
BEGIN;

-- Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can insert own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Users can view own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can view all manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can update all manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_read_own" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_insert_own" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "manual_payments_update_service" ON public.manual_payment_submissions;

-- Crear políticas correctas
CREATE POLICY "Users can insert own manual payments"
  ON public.manual_payment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ⚠️ ESTA ES LA POLÍTICA MÁS IMPORTANTE
CREATE POLICY "Admins can update all manual payments"
  ON public.manual_payment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

COMMIT;
```

### Paso 2: Verificar que las Políticas se Crearon Correctamente

Ejecuta esta consulta para verificar:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'manual_payment_submissions'
ORDER BY policyname;
```

Deberías ver 4 políticas:
- `Users can insert own manual payments` (INSERT)
- `Users can view own manual payments` (SELECT)
- `Admins can view all manual payments` (SELECT)
- `Admins can update all manual payments` (UPDATE) ⚠️ **Esta es la clave**

### Paso 3: Verificar que tu Usuario es Admin

Verifica que tu usuario tiene `is_admin = TRUE` en la tabla `profiles`:

```sql
SELECT id, email, full_name, is_admin 
FROM public.profiles 
WHERE id = auth.uid();
```

Si `is_admin` es `FALSE` o `NULL`, actualízalo:

```sql
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE id = 'TU_USER_ID_AQUI';
```

### Paso 4: Verificar Variable de Entorno

Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurada en tu entorno (`.env.local` o en producción):

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

Puedes encontrar esta clave en:
- Supabase Dashboard → Settings → API → `service_role` key (secret)

### Paso 5: Probar los Botones

1. **Botones Aprobar/Rechazar**:
   - Deben funcionar correctamente ahora
   - Si aún falla, revisa la consola del navegador (F12) para ver errores
   - Revisa los logs del servidor para ver los mensajes `[APPROVE]` o `[REJECT]`

2. **Botones Descargar/Ampliar**:
   - Deben aparecer siempre debajo de cada imagen del comprobante
   - Si no aparecen, verifica que la imagen se esté cargando correctamente
   - El botón "Descargar" descargará el archivo con nombre: `comprobante-{nombre-negocio}-{id}.jpg`
   - El botón "Ampliar" abrirá un modal en pantalla completa

## Cambios Realizados en el Código

### 1. Endpoints Mejorados (`approve` y `reject`)
- ✅ Agregado logging detallado para debugging
- ✅ Mejorado manejo de errores con mensajes específicos
- ✅ Configuración explícita del cliente Supabase con service role key
- ✅ Validación de errores más robusta

### 2. Componente UI Mejorado
- ✅ Botones de descargar/ampliar siempre visibles (solo se deshabilitan mientras carga)
- ✅ Modal de pantalla completa mejorado con mejor UX
- ✅ Soporte para tecla ESC para cerrar modal
- ✅ Descarga de imágenes funcional usando signed URLs

### 3. Script SQL Creado
- ✅ `scripts/fix-manual-payments-rls.sql` - Script para corregir políticas RLS

## Solución de Problemas

### Si los botones aún no funcionan:

1. **Revisa la consola del navegador (F12 → Console)**:
   - Busca errores relacionados con `/api/admin/payments/approve` o `/api/admin/payments/reject`
   - Copia el error completo

2. **Revisa los logs del servidor**:
   - Busca mensajes que empiecen con `[APPROVE]` o `[REJECT]`
   - Estos logs te dirán exactamente dónde falla

3. **Verifica que el ID se esté pasando correctamente**:
   - Abre las DevTools → Network → busca la llamada a `/api/admin/payments/approve`
   - Verifica que el `body` incluya `submission_id` con un UUID válido

4. **Verifica permisos de admin**:
   ```sql
   -- Verificar tu estado de admin
   SELECT id, email, is_admin 
   FROM public.profiles 
   WHERE id = auth.uid();
   ```

### Si los botones de descargar/ampliar no aparecen:

1. **Verifica que la imagen se esté cargando**:
   - Abre DevTools → Network → busca requests a Supabase Storage
   - Verifica que las signed URLs se generen correctamente

2. **Revisa errores en la consola**:
   - Busca errores relacionados con `createSignedUrl`
   - Verifica que el bucket `payment_receipts` exista y tenga las políticas correctas

3. **Verifica el formato de `screenshot_url`**:
   - Debe tener el formato: `https://xxx.supabase.co/storage/v1/object/public/payment_receipts/userId/businessId/file.jpg`
   - O: `https://xxx.supabase.co/storage/v1/object/sign/payment_receipts/...`

## Notas Importantes

- ⚠️ **Service Role Key**: Los endpoints usan `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS, pero las políticas RLS siguen siendo importantes para el frontend
- ✅ **Seguridad**: Las políticas RLS aseguran que solo los admins puedan actualizar pagos, incluso si alguien intenta hacerlo desde el frontend
- 🔒 **Private Bucket**: El bucket `payment_receipts` es privado, por eso necesitamos signed URLs para ver las imágenes
- 📝 **Logging**: Se agregó logging detallado en los endpoints para facilitar el debugging


