# 🔧 FIX: Admin No Funciona en Producción

## 🐛 Problema

El acceso de administrador funciona en **local** pero **NO en producción**.

## 🔍 Causas Comunes

1. **❌ Variable de entorno faltante**: `SUPABASE_SERVICE_ROLE_KEY` no está configurada en producción
2. **❌ Variables de entorno incorrectas**: URLs o keys incorrectas
3. **❌ Políticas RLS**: Más restrictivas en producción
4. **❌ Cache del navegador**: Información antigua cacheada

## ✅ Solución Implementada

He mejorado la API route `/api/user/is-admin` para que:

1. ✅ **Intente primero con Service Role Key** (bypassa RLS)
2. ✅ **Haga fallback a cliente normal** si Service Role no está disponible
3. ✅ **Mejore el logging** para debugging en producción
4. ✅ **Retorne información de debug** útil para identificar problemas

## 🔧 PASOS PARA CORREGIR EN PRODUCCIÓN

### PASO 1: Verificar Variables de Entorno en Hosting

**Si usas Vercel:**

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Verifica que existan estas variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```
4. **IMPORTANTE**: Verifica que estén en el **entorno correcto** (Production, Preview, Development)
5. Si falta `SUPABASE_SERVICE_ROLE_KEY`, agrégalo:
   - Ve a Supabase Dashboard → Settings → API
   - Copia el "service_role" key (la larga, que empieza con `eyJ...`)
   - Pégalo en Vercel como `SUPABASE_SERVICE_ROLE_KEY`

**Si usas otra plataforma (Netlify, Railway, etc.):**

Sigue los mismos pasos pero en la configuración de variables de entorno de tu plataforma.

### PASO 2: Verificar en Supabase que el Usuario es Admin

Ejecuta este SQL en **Supabase Dashboard → SQL Editor**:

```sql
-- Reemplaza con tu email
SELECT 
  u.id,
  u.email,
  p.is_admin,
  p.role,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    WHEN p.is_admin IS NULL THEN '⚠️ is_admin es NULL'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'tu-email@example.com';
```

**Si `is_admin` es `FALSE` o `NULL`**, ejecuta:

```sql
-- Actualizar is_admin a TRUE
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@example.com'
);
```

### PASO 3: Reiniciar la Aplicación en Producción

Después de agregar/modificar variables de entorno:

1. **En Vercel**: Hace un nuevo deploy (puedes hacer un commit vacío o usar "Redeploy" en el dashboard)
2. **En otras plataformas**: Reinicia la aplicación

### PASO 4: Limpiar Cache y Probar

1. **Cierra sesión** completamente
2. **Limpia el cache del navegador**:
   - Chrome/Edge: `Ctrl+Shift+Delete` → "Cached images and files"
   - O usa modo incógnito para probar
3. **Inicia sesión nuevamente**
4. Ve a `/app/dashboard/perfil`
5. Deberías ver:
   - ✅ Badge "🔥 Administrador"
   - ✅ Botón "Panel de Control Admin"

## 🐛 Debugging en Producción

### Ver Logs en Producción

**En Vercel:**
1. Ve a tu proyecto → Deployments
2. Click en el último deployment
3. Ve a "Functions" tab
4. Busca logs de `/api/user/is-admin`

**Lo que buscar:**

**✅ Si funciona:**
```
✅ Verificación Admin completada: email@example.com -> ES ADMIN
```

**❌ Si no funciona, busca estos errores:**

1. **"ERROR CRÍTICO: Falta SUPABASE_SERVICE_ROLE_KEY"**
   - **Solución**: Agrega la variable de entorno (PASO 1)

2. **"Error leyendo perfil"**
   - **Solución**: Verifica que el usuario existe y tiene `is_admin = TRUE` (PASO 2)

3. **"Perfil no encontrado"**
   - **Solución**: El usuario no tiene perfil en `profiles`. Ejecuta el script de creación de perfil.

### Probar la API Directamente

En la consola del navegador (F12) en producción, ejecuta:

```javascript
fetch('/api/user/is-admin')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data)
    if (data.debug) {
      console.log('Debug info:', data.debug)
    }
  })
```

**Respuesta esperada (si eres admin):**
```json
{
  "isAdmin": true,
  "debug": {
    "userId": "...",
    "email": "tu-email@example.com",
    "role": "person",
    "is_admin_value": true,
    "hasServiceRoleKey": true
  }
}
```

**Si `isAdmin: false`:**
- Revisa `debug.is_admin_value` - si es `false` o `null`, ejecuta PASO 2
- Revisa `debug.hasServiceRoleKey` - si es `false`, ejecuta PASO 1

## 📋 Checklist Completo

Antes de reportar el problema, verifica:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurada en producción
- [ ] Variables de entorno están en el entorno correcto (Production)
- [ ] Aplicación fue redeployeada después de agregar variables
- [ ] Usuario tiene `is_admin = TRUE` en tabla `profiles` (verificado con SQL)
- [ ] Cache del navegador fue limpiado
- [ ] Sesión fue cerrada y re-iniciada
- [ ] Logs de producción fueron revisados
- [ ] API `/api/user/is-admin` fue probada directamente

## 🔐 Seguridad

**⚠️ IMPORTANTE:**
- `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe estar en el código fuente
- **NUNCA** debe estar en `.env` que se suba a Git
- Solo debe estar en variables de entorno del hosting
- El código ahora tiene fallback seguro si no está disponible

## ✅ Resultado Esperado

Después de seguir estos pasos:

1. ✅ La API `/api/user/is-admin` retorna `isAdmin: true`
2. ✅ El badge "🔥 Administrador" aparece en `/app/dashboard/perfil`
3. ✅ El botón "Panel de Control Admin" aparece
4. ✅ Puedes acceder a `/app/admin` sin errores
5. ✅ Los logs muestran "ES ADMIN" correctamente

---

**Si después de seguir todos los pasos sigue sin funcionar**, comparte:
- Los logs de producción de `/api/user/is-admin`
- La respuesta de la API cuando la pruebas directamente
- Un screenshot de las variables de entorno configuradas (sin mostrar los valores)




