# 🔧 Solución Paso a Paso: Permisos de Administrador

## ❌ Problema Actual

El badge "🔥 Administrador" y el botón "Panel de Control Admin" no aparecen en el perfil, aunque el usuario tiene `is_admin = TRUE` en la base de datos.

---

## ✅ Solución Completa

### **PASO 1: Ejecutar Script de Diagnóstico** 🔍

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `scripts/diagnostico-admin-completo.sql`
3. Ejecuta el script completo
4. Revisa los resultados, especialmente la sección **"7. RESUMEN FINAL"**

**Qué buscar:**
- ✅ Si dice `✅ TODO CORRECTO` → El problema está en el código
- ⚠️ Si dice `⚠️ Admin en profile pero falta en metadata` → Ejecutar PASO 2
- ❌ Si dice `❌ FALTA CONFIGURAR PERMISOS` → Ejecutar PASO 2

---

### **PASO 2: Restaurar Permisos de Admin** 🔧

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `scripts/fix-admin-complete-final.sql`
3. Ejecuta el script completo
4. Verifica que aparezca: `✅ ADMINISTRADOR COMPLETO - TODO CORRECTO`

**Este script:**
- ✅ Asegura que `is_admin = TRUE` en `profiles`
- ✅ Actualiza `raw_user_meta_data` en `auth.users`
- ✅ Crea/actualiza políticas RLS necesarias
- ✅ Verifica que todo esté correcto

---

### **PASO 3: Verificar en la Consola del Navegador** 🖥️

1. Abre la aplicación en el navegador
2. Inicia sesión con `mantoniorodriguez94@gmail.com`
3. Abre la **Consola del Navegador** (F12 → Console)
4. Ve a `/app/dashboard/perfil`
5. Busca estos logs:

**Logs esperados:**
```
🔍 Verificación admin: { isAdmin: true, error: null, userId: "..." }
✅ Usuario es administrador
```

**Si ves errores:**
- `❌ Error leyendo perfil` → Problema de RLS o perfil no existe
- `❌ No autenticado` → Problema de sesión
- `isAdmin: false` → El script SQL no se ejecutó correctamente

---

### **PASO 4: Verificar API Route Directamente** 🌐

1. Con la sesión iniciada, abre la consola del navegador
2. Ejecuta este comando:

```javascript
fetch('/api/user/is-admin')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
```

**Respuesta esperada:**
```json
{
  "isAdmin": true,
  "error": null,
  "debug": {
    "userId": "...",
    "email": "mantoniorodriguez94@gmail.com",
    "is_admin_value": true,
    "role": "person"
  }
}
```

**Si `isAdmin: false`:**
- Revisa el campo `debug` para ver qué está pasando
- Si `is_admin_value` es `null` o `false`, ejecuta el PASO 2 nuevamente

---

### **PASO 5: Limpiar Cache y Reiniciar** 🔄

1. **Cierra sesión completamente** en la aplicación
2. **Limpia el cache del navegador:**
   - Chrome/Edge: `Ctrl+Shift+Delete` (Windows) o `Cmd+Shift+Delete` (Mac)
   - Selecciona "Cached images and files"
   - Click en "Clear data"
3. **Cierra todas las pestañas** de la aplicación
4. **Reinicia el servidor de desarrollo** (si estás en desarrollo):
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```
5. **Inicia sesión nuevamente** con `mantoniorodriguez94@gmail.com`
6. Ve a `/app/dashboard/perfil`

---

### **PASO 6: Verificar Visualmente** 👀

En `/app/dashboard/perfil`, debes ver:

1. ✅ **Badge "🔥 Administrador"** junto a "Cuenta Negocio" o "Cuenta Personal"
2. ✅ **Botón "Panel de Control Admin"** en la sección "Configuración"
3. ✅ Al hacer click en el botón, debe redirigir a `/app/admin` sin errores

---

## 🐛 Solución de Problemas

### **Problema: Badge no aparece**

**Causas posibles:**
1. `isAdmin` state no se está actualizando
2. API route retorna `isAdmin: false`
3. Problema de RLS impidiendo lectura

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca los logs de verificación admin
3. Si ves `isAdmin: false`, ejecuta el PASO 2
4. Si ves errores de RLS, ejecuta el script de políticas RLS

---

### **Problema: Botón "Panel de Control Admin" no aparece**

**Causas posibles:**
1. `isAdmin` state es `false`
2. El componente no se está renderizando

**Solución:**
1. Verifica en la consola que `isAdmin` sea `true`
2. Verifica que el código tenga `{isAdmin && (...)}`
3. Recarga la página (F5)

---

### **Problema: Error al acceder a /app/admin**

**Causas posibles:**
1. `checkAdminAuth()` falla
2. Políticas RLS bloquean acceso

**Solución:**
1. Revisa los logs del servidor Next.js
2. Verifica que las políticas RLS permitan lectura de `is_admin`
3. Ejecuta el script `fix-admin-complete-final.sql` nuevamente

---

## 📋 Checklist Final

- [ ] Script de diagnóstico ejecutado
- [ ] Script de restauración ejecutado
- [ ] Resultado: `✅ ADMINISTRADOR COMPLETO`
- [ ] Sesión cerrada y vuelta a iniciar
- [ ] Cache del navegador limpiado
- [ ] Logs en consola muestran `isAdmin: true`
- [ ] API route `/api/user/is-admin` retorna `isAdmin: true`
- [ ] Badge "🔥 Administrador" aparece en el perfil
- [ ] Botón "Panel de Control Admin" aparece
- [ ] Acceso a `/app/admin` funciona correctamente

---

## 🔍 Verificación en Base de Datos

Ejecuta este query para verificar el estado final:

```sql
SELECT 
  u.email,
  p.is_admin,
  p.role,
  (u.raw_user_meta_data->>'is_admin')::boolean as is_admin_metadata,
  CASE 
    WHEN p.is_admin = TRUE 
      AND (u.raw_user_meta_data->>'is_admin')::boolean = TRUE
    THEN '✅ TODO CORRECTO'
    ELSE '❌ FALTA CONFIGURAR'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';
```

Debe mostrar:
- `is_admin`: `true`
- `is_admin_metadata`: `true`
- `estado`: `✅ TODO CORRECTO`

---

## 📝 Notas Importantes

1. **RLS puede bloquear lectura**: Si las políticas RLS no están configuradas correctamente, la API route puede fallar. El script `fix-admin-complete-final.sql` crea las políticas necesarias.

2. **Cache del navegador**: A veces el navegador cachea el estado anterior. Siempre limpia el cache después de cambios en la base de datos.

3. **Service Role Key**: La API route ahora usa el service role key como fallback si hay problemas de RLS. Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurado en `.env.local`.

4. **Logs de depuración**: Los logs en la consola del navegador y del servidor te ayudarán a identificar exactamente dónde está el problema.

---

**Si después de seguir todos estos pasos el problema persiste, comparte:**
1. Los logs de la consola del navegador
2. Los logs del servidor Next.js
3. El resultado del script de diagnóstico
4. El resultado del query de verificación

