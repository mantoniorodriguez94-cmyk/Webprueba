# 🔧 Restaurar Permisos de Administrador

## ⚠️ Problema Reportado

Después de usar los botones de "Suspender" y "Verificar" en el panel admin, se perdieron los permisos de administrador.

---

## 🔍 Análisis

**Buenas noticias**: Las rutas API que modificamos (`/api/admin/business/verificar` y `/api/admin/business/suspender`) **NO modifican la tabla `profiles`** ni el campo `is_admin`. Solo modifican la tabla `businesses`.

**Posibles causas**:
1. Un error manual accidental
2. Algún trigger o función en la base de datos que se ejecutó inesperadamente
3. Un problema de sincronización

---

## ✅ Solución Rápida: Restaurar Permisos

### Paso 1: Ejecutar Script de Restauración

1. Ve a **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Abre el archivo: `scripts/restore-admin-permissions.sql`
3. **Cambia el email** en la línea 18:
   ```sql
   admin_email TEXT := 'TU_EMAIL@ejemplo.com';  -- 👈 CAMBIA ESTO
   ```
4. Ejecuta el script completo

### Paso 2: Verificar

Ejecuta esta consulta para verificar:
```sql
SELECT 
  u.email,
  p.is_admin,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL@ejemplo.com';  -- 👈 Tu email
```

### Paso 3: Cerrar e Iniciar Sesión

1. **Cierra sesión** completamente en la aplicación
2. **Inicia sesión** nuevamente
3. Intenta acceder a `/app/admin`

---

## 🛡️ Prevención: Proteger Campo is_admin

Para prevenir que esto vuelva a pasar, ejecuta el script de protección:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `scripts/fix-protect-admin-field.sql`
3. Ejecuta el script completo

Este script:
- ✅ Actualiza `handle_new_user()` para **NO sobrescribir** `is_admin`
- ✅ Crea un trigger que **protege** `is_admin` de cambios accidentales
- ✅ Solo permite que admins cambien el campo `is_admin`

---

## 📋 Script SQL Rápido (Copia y Pega)

Si prefieres hacerlo rápido, copia y pega esto en SQL Editor:

```sql
-- Reemplaza 'TU_EMAIL@ejemplo.com' con tu email
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com');

-- Verificar
SELECT 
  u.email,
  p.is_admin,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL@ejemplo.com';
```

---

## 🔒 Seguridad Mejorada

Después de restaurar tus permisos, ejecuta el script de protección (`fix-protect-admin-field.sql`) para:
- Prevenir que `is_admin` se pierda accidentalmente
- Proteger el campo de cambios no autorizados
- Mantener la integridad de los permisos de administrador

---

## ✅ Verificación Final

Después de ejecutar los scripts:

1. ✅ Verifica que `is_admin = TRUE` en la base de datos
2. ✅ Cierra sesión y vuelve a iniciar sesión
3. ✅ Accede a `/app/admin` - deberías poder entrar
4. ✅ Prueba los botones de admin - deberían funcionar

---

**¿Necesitas ayuda?** Si después de ejecutar estos scripts aún tienes problemas, verifica:
1. Que el email sea correcto
2. Que el usuario exista en `auth.users`
3. Que el usuario tenga un registro en `profiles`

