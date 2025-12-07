# 🔐 Cómo Obtener Permisos de Administrador

## 📋 Resumen

Para acceder al panel de administradores (`/app/admin`), tu usuario necesita tener el campo `is_admin = TRUE` en la tabla `profiles` de Supabase.

---

## ✅ Pasos para Obtener Permisos de Admin

### **Opción 1: Usando el Script SQL (Recomendado)**

1. **Abre Supabase Dashboard**
   - Ve a [https://supabase.com](https://supabase.com)
   - Inicia sesión y selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en **"SQL Editor"**
   - Haz clic en **"New Query"**

3. **Ejecuta el Script**
   - Abre el archivo `scripts/otorgar-admin.sql` en tu proyecto
   - **IMPORTANTE:** Reemplaza `'TU_EMAIL@ejemplo.com'` con tu email real (en dos lugares)
   - Copia todo el contenido del script
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **"Run"** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifica que Funcionó**
   - Deberías ver un mensaje como: `✅ Usuario tu_email@ejemplo.com configurado como ADMINISTRADOR`
   - Ejecuta la consulta de verificación al final del script para confirmar

5. **Cierra Sesión y Vuelve a Iniciar Sesión**
   - En tu aplicación, cierra sesión completamente
   - Inicia sesión nuevamente con tu email
   - Ahora deberías poder acceder a `/app/admin`

---

### **Opción 2: Usando el Editor de Tablas (Más Simple)**

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en Supabase

2. **Abre la Tabla `profiles`**
   - En el menú lateral, haz clic en **"Table Editor"**
   - Selecciona la tabla **`profiles`**

3. **Encuentra tu Usuario**
   - Busca tu registro por email o por tu `id` (UUID)
   - Si no ves la columna `is_admin`, primero ejecuta el Paso 1 del script SQL:
     ```sql
     ALTER TABLE public.profiles 
     ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
     ```

4. **Actualiza el Campo `is_admin`**
   - Haz clic en tu registro
   - Busca la columna `is_admin`
   - Cambia el valor de `false` a `true`
   - Guarda los cambios

5. **Cierra Sesión y Vuelve a Iniciar Sesión**
   - En tu aplicación, cierra sesión completamente
   - Inicia sesión nuevamente
   - Ahora deberías poder acceder a `/app/admin`

---

### **Opción 3: SQL Directo (Si Conoces tu Email)**

Si prefieres ejecutar solo el comando SQL necesario:

```sql
-- Reemplaza 'tu_email@ejemplo.com' con tu email real
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu_email@ejemplo.com');
```

Luego verifica:

```sql
SELECT 
  u.email,
  p.is_admin,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMINISTRADOR'
    ELSE '❌ NO ES ADMINISTRADOR'
  END as estado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'tu_email@ejemplo.com';
```

---

## 🔍 Verificar que Tienes Permisos de Admin

### En la Base de Datos:

```sql
-- Ver todos los administradores
SELECT 
  u.email,
  p.full_name,
  p.is_admin,
  p.role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
```

### En la Aplicación:

1. Inicia sesión con tu cuenta
2. Intenta acceder a: `http://localhost:3000/app/admin`
3. Si tienes permisos, verás el panel de administración
4. Si no tienes permisos, serás redirigido a `/app/dashboard`

---

## ❌ Problemas Comunes

### **Problema: "No autenticado"**
- **Solución:** Asegúrate de estar iniciado sesión en la aplicación

### **Problema: "Perfil no encontrado"**
- **Solución:** El usuario debe tener un registro en la tabla `profiles`. Si no existe, regístrate primero en la aplicación.

### **Problema: La columna `is_admin` no existe**
- **Solución:** Ejecuta primero esta línea en SQL Editor:
  ```sql
  ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
  ```

### **Problema: Cambié `is_admin` a `true` pero aún no funciona**
- **Solución:** 
  1. Cierra sesión completamente en la aplicación
  2. Limpia las cookies/caché del navegador
  3. Inicia sesión nuevamente
  4. Si aún no funciona, espera unos segundos (puede haber un pequeño delay en la sincronización)

---

## 📝 Notas Importantes

1. **Seguridad:** Los permisos de administrador te dan acceso completo al panel de administración. Úsalos con responsabilidad.

2. **Múltiples Administradores:** Puedes tener múltiples usuarios con permisos de admin. Solo necesitas ejecutar el script para cada uno.

3. **Quitar Permisos de Admin:** Si necesitas quitar permisos de admin a un usuario:
   ```sql
   UPDATE public.profiles
   SET is_admin = FALSE
   WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');
   ```

4. **Primera Vez:** Si es la primera vez que configuras el sistema de administradores, ejecuta el script completo `scripts/create-admin-role.sql` que configura todo el sistema (políticas RLS, funciones, etc.).

---

## 🎯 Resumen Rápido

1. ✅ Ejecuta el script SQL en Supabase (reemplazando tu email)
2. ✅ Verifica que `is_admin = TRUE` en tu perfil
3. ✅ Cierra sesión y vuelve a iniciar sesión
4. ✅ Accede a `/app/admin`

¡Listo! Ahora deberías tener acceso al panel de administradores. 🎉

