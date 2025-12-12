# 🔐 Otorgar Permisos de Administrador a mantoniorodriguez94@gmail.com

## 📋 Resumen

Este script otorga permisos de administrador **completos** al usuario `mantoniorodriguez94@gmail.com`, asegurando que tenga acceso absoluto a todo el proyecto.

---

## 🚀 Pasos para Ejecutar

### **PASO 1: Ejecutar el Script SQL**

1. Ve a **Supabase Dashboard**
2. Click en **SQL Editor** (barra lateral izquierda)
3. Click en **+ New Query**
4. Abre el archivo: `scripts/grant-admin-mantonio.sql`
5. **Copia TODO el contenido** del script
6. Pégalo en el SQL Editor de Supabase
7. Click en **RUN** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

### **PASO 2: Verificar el Resultado**

Después de ejecutar el script, deberías ver:

```
✅ Usuario mantoniorodriguez94@gmail.com configurado como ADMINISTRADOR
   User ID: [UUID del usuario]
```

Y al final, una tabla de verificación que muestra:
- ✅ **es_admin_en_profile**: SÍ
- ✅ **es_admin_en_metadata**: SÍ
- ✅ **resultado**: PERFECTO - Usuario tiene permisos completos

### **PASO 3: Cerrar Sesión y Volver a Iniciar**

1. En tu aplicación, **cierra sesión completamente**
2. **Limpia el cache del navegador** (opcional pero recomendado)
3. **Inicia sesión nuevamente** con `mantoniorodriguez94@gmail.com`
4. Ve a `/app/dashboard/perfil`
5. ✅ Debe aparecer el botón "Panel de Control Admin"
6. Click en el botón
7. ✅ Debe redirigir a `/app/admin` sin problemas

---

## 🔍 Qué Hace el Script

1. **Asegura que `is_admin` existe** en la tabla `profiles`
2. **Busca el usuario** por email `mantoniorodriguez94@gmail.com`
3. **Actualiza `is_admin = TRUE`** en la tabla `profiles`
4. **Actualiza los metadatos** en `auth.users` para incluir `is_admin: true`
5. **Crea/actualiza políticas RLS** para que los admins puedan acceder a todo
6. **Verifica** que todo esté correcto

---

## ✅ Verificación Manual

Si quieres verificar manualmente que funcionó, ejecuta este query en Supabase:

```sql
SELECT 
  u.email,
  p.is_admin,
  u.raw_user_meta_data->>'is_admin' as is_admin_metadata,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';
```

Deberías ver:
- `is_admin`: `true`
- `is_admin_metadata`: `true`
- `estado`: `✅ ES ADMIN`

---

## 🐛 Si Aún No Funciona

### **Problema 1: El usuario no existe**

**Solución**: 
1. Asegúrate de que el usuario esté registrado en la aplicación
2. Verifica que el email sea exactamente `mantoniorodriguez94@gmail.com` (sin espacios)

### **Problema 2: El botón de admin no aparece**

**Solución**:
1. Cierra sesión completamente
2. Limpia el cache del navegador
3. Inicia sesión nuevamente
4. Verifica que `is_admin = TRUE` en la base de datos

### **Problema 3: Error al acceder a /app/admin**

**Solución**:
1. Abre la consola del navegador (F12)
2. Revisa los logs del servidor Next.js
3. Verifica que no haya errores de RLS
4. Ejecuta el script nuevamente si es necesario

---

## 📝 Notas Importantes

- ✅ El script es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- ✅ Solo afecta al usuario `mantoniorodriguez94@gmail.com`
- ✅ No modifica otros usuarios
- ✅ Crea las políticas RLS necesarias si no existen

---

**Después de ejecutar el script y reiniciar sesión, el usuario debería tener acceso completo al panel de administración** ✅

