# 🔐 Solución: Permisos de Administrador No Funcionan

## ❌ Problema Reportado

Cualquier usuario puede editar y eliminar negocios, incluso sin ser administrador. Los permisos solo deberían aplicar a:
1. **Administradores autorizados** (mantoniorodriguez94@gmail.com)
2. **Dueños de sus propios negocios**

---

## 🔍 Diagnóstico

He agregado **logs de depuración** temporales que te ayudarán a identificar el problema:

### Paso 1: Ver los Logs en el Navegador

1. **Abre tu sitio web** y accede al Dashboard
2. **Abre la Consola del Navegador** (F12 o Clic derecho → Inspeccionar → Console)
3. **Busca estos logs:**

```
Dashboard User Debug: {
  userId: "xxx-xxx-xxx",
  email: "tu_email@gmail.com",
  userMetadata: {...},
  isAdmin: false,  ← DEBE SER true SOLO PARA EL ADMIN
  isCompany: true/false,
  userRole: "company"/"person"
}
```

```
BusinessFeedCard Debug: {
  businessName: "Nombre del negocio",
  businessOwnerId: "xxx-xxx-xxx",  ← ID del dueño del negocio
  currentUserId: "yyy-yyy-yyy",     ← ID del usuario logueado
  isOwner: false,  ← true si los IDs coinciden
  isAdmin: false,  ← true si el usuario es admin
  canEdit: false,  ← NO debe ser true para todos
  canDelete: false ← NO debe ser true para todos
}
```

### Paso 2: Identificar el Problema

Revisa los logs y encuentra cuál de estos problemas tienes:

#### 🔴 **Problema A: Todos los negocios tienen el mismo owner_id**
```
// Si ves esto en TODOS los negocios:
businessOwnerId: "abc-123"  (siempre el mismo ID)
currentUserId: "abc-123"    (coincide con tu usuario)
isOwner: true               (por eso puedes editar todo)
```

**Causa:** Los negocios de prueba que insertaste tienen TU user_id como dueño.

#### 🔴 **Problema B: El campo is_admin no existe en la base de datos**
```
Dashboard User Debug: {
  userMetadata: {
    full_name: "...",
    role: "company",
    // is_admin NO APARECE AQUÍ ← Problema!
  },
  isAdmin: false  (siempre false)
}
```

**Causa:** No has ejecutado el script `create-admin-role.sql`.

#### 🔴 **Problema C: El admin no está configurado correctamente**
```
// Incluso cuando ingresas con mantoniorodriguez94@gmail.com:
isAdmin: false  ← Debería ser true
```

**Causa:** Los metadatos del usuario admin no están sincronizados.

---

## ✅ Soluciones

### 🔧 Solución para Problema A: Owner_id Incorrecto

Si todos los negocios tienen tu user_id, necesitas:

1. **Ir a Supabase Dashboard** → SQL Editor
2. **Ejecutar este script:**

```sql
-- Obtener tu user_id (del email con el que iniciaste sesión)
SELECT id, email FROM auth.users WHERE email = 'tu_email@gmail.com';

-- Ahora actualiza los negocios que NO son tuyos
-- (Cambia 'tu_user_id' por el ID que obtuviste arriba)

-- Opción 1: Asignar negocios a un usuario genérico de prueba
UPDATE public.businesses
SET owner_id = (SELECT id FROM auth.users WHERE email = 'mantoniorodriguez94@gmail.com')
WHERE name IN ('Negocio 1', 'Negocio 2', 'Negocio 3');  -- Pon los nombres de negocios que NO son tuyos

-- Opción 2: Crear usuarios de prueba para cada negocio
-- (Esto es mejor para testing real)
-- Primero registra usuarios nuevos desde tu web, luego:
UPDATE public.businesses
SET owner_id = (SELECT id FROM auth.users WHERE email = 'otro_usuario@gmail.com')
WHERE name = 'Negocio que pertenece a otro usuario';
```

### 🔧 Solución para Problema B: Campo is_admin No Existe

1. **Ir a Supabase Dashboard** → SQL Editor
2. **Ejecutar el script completo:** `scripts/create-admin-role.sql`
3. **Cerrar sesión** en tu web
4. **Iniciar sesión nuevamente** con mantoniorodriguez94@gmail.com
5. **Verificar** los logs en la consola

### 🔧 Solución para Problema C: Admin No Sincronizado

Si ejecutaste el script pero `is_admin` sigue siendo `false`:

```sql
-- 1. Verificar que el campo existe
SELECT * FROM public.profiles WHERE email = 'mantoniorodriguez94@gmail.com';

-- 2. Si is_admin es NULL o false, actualizar manualmente:
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'mantoniorodriguez94@gmail.com');

-- 3. Actualizar también los metadatos del usuario
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"is_admin": true}'::jsonb
    ELSE raw_user_meta_data || '{"is_admin": true}'::jsonb
  END
WHERE email = 'mantoniorodriguez94@gmail.com';

-- 4. Verificar que se aplicó correctamente
SELECT 
  u.email,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  p.is_admin as is_admin_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';
```

---

## 🔬 Script de Diagnóstico Completo

He creado un script de diagnóstico que te mostrará TODA la información necesaria:

1. **Ir a Supabase Dashboard** → SQL Editor
2. **Abrir el archivo:** `scripts/diagnostico-permisos.sql`
3. **Copiar TODO el contenido** del archivo
4. **Pegarlo en SQL Editor** de Supabase
5. **Ejecutar** (botón Run o Ctrl+Enter)
6. **Revisar los resultados** de cada sección

El script te dirá exactamente cuál es el problema.

---

## 🧪 Verificación Final

Una vez que apliques la solución:

1. **Cerrar sesión** en tu web
2. **Iniciar sesión con un usuario NO ADMIN** (ej: una cuenta de prueba)
3. **Verificar en la consola:**
   - `isAdmin: false` ✅
   - Solo ves botones de editar/eliminar en TUS negocios ✅
4. **Cerrar sesión**
5. **Iniciar sesión con mantoniorodriguez94@gmail.com**
6. **Verificar en la consola:**
   - `isAdmin: true` ✅
   - Ves botones de editar/eliminar en TODOS los negocios ✅
   - Aparece badge "Admin" en negocios que no son tuyos ✅

---

## 🗑️ Limpiar Logs de Debug

Una vez que todo funcione correctamente, puedes remover los logs de debug (son temporales y solo aparecen en desarrollo):

Los logs están en:
- `src/app/app/dashboard/page.tsx` (líneas 40-51)
- `src/components/feed/BusinessFeedCard.tsx` (líneas 35-45)

O simplemente déjalos, no afectan producción porque solo se ejecutan en `NODE_ENV === 'development'`.

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos el problema persiste:

1. **Copia los resultados** del script de diagnóstico
2. **Copia los logs** de la consola del navegador
3. **Compártelos conmigo** para ayudarte a resolverlo

---

## 📚 Resumen de Archivos Modificados

- ✅ `src/app/app/dashboard/page.tsx` - Agregado log de debug de usuario
- ✅ `src/components/feed/BusinessFeedCard.tsx` - Agregado log de debug de permisos
- ✅ `scripts/diagnostico-permisos.sql` - Script nuevo de diagnóstico
- ✅ `SOLUCION_PERMISOS_ADMIN.md` - Este documento

**La lógica de permisos está CORRECTA**, solo necesitamos verificar que los datos en Supabase estén bien configurados. 🔐

