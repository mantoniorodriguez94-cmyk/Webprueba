# ✅ Fix: Panel Admin - Usuarios Registrados

## 📋 Problema

El botón "Usuarios Registrados" en el panel administrativo no mostraba información y generaba un error.

**Causa**: Las políticas RLS (Row Level Security) de la tabla `profiles` solo permitían que cada usuario viera su propio perfil, pero no había una política que permitiera a los administradores ver todos los perfiles.

---

## ✅ Solución Implementada

### 1. Script SQL para Políticas RLS

**Archivo creado**: `scripts/fix-profiles-admin-rls.sql`

Este script agrega:
- ✅ Política RLS: "Admins can view all profiles" - Permite a admins ver todos los perfiles
- ✅ Política RLS: "Admins can update any profile" - Permite a admins actualizar cualquier perfil

### 2. Mejoras en la Página de Usuarios

**Archivo modificado**: `src/app/app/admin/usuarios/page.tsx`

**Cambios**:
- ✅ Mejor manejo de errores con mensaje detallado
- ✅ Mensaje de error visible en la UI si falla la carga
- ✅ Instrucciones claras para ejecutar el script SQL si hay error

---

## 🚀 Pasos para Aplicar el Fix

### Paso 1: Ejecutar el Script SQL

1. Ve a tu proyecto en **Supabase Dashboard**
2. Abre **SQL Editor** → **New Query**
3. Copia y pega el contenido de `scripts/fix-profiles-admin-rls.sql`
4. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`

### Paso 2: Verificar que Funciona

1. Ve a tu aplicación: `/app/admin`
2. Haz clic en la tarjeta **"Usuarios Registrados"**
3. Deberías ver:
   - ✅ Lista completa de usuarios registrados
   - ✅ Información: nombre, email, rol, estado admin, fecha de registro
   - ✅ Sin errores

---

## 📊 Información Mostrada

La página muestra para cada usuario:

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Avatar + Nombre completo |
| **Email** | Correo electrónico |
| **Rol** | `person` o `company` |
| **Estado** | Badge "Admin" o "Usuario" |
| **Registro** | Fecha de registro formateada |

---

## 🔒 Seguridad

Las políticas RLS creadas:

1. **"Admins can view all profiles"**
   - Permite que usuarios con `is_admin = true` vean todos los perfiles
   - Solo se aplica a SELECT (lectura)

2. **"Admins can update any profile"**
   - Permite que usuarios con `is_admin = true` actualicen cualquier perfil
   - Solo se aplica a UPDATE (actualización)

**Verificación**: Las políticas verifican que el usuario actual (`auth.uid()`) tenga `is_admin = true` en la tabla `profiles`.

---

## 🧪 Testing

### Verificar que Funciona

1. **Como Admin**:
   - ✅ Puedes ver todos los usuarios
   - ✅ Puedes ver información completa (email, rol, estado)

2. **Como Usuario Regular** (si accedes al panel admin):
   - ❌ No deberías poder acceder (redirige si no eres admin)
   - ✅ Las políticas RLS previenen acceso no autorizado

---

## 📝 Código de las Políticas

```sql
-- Política para ver todos los perfiles (admins)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```

---

## ⚠️ Si Aún Hay Errores

Si después de ejecutar el script SQL aún ves errores:

1. **Verifica que eres admin**:
   ```sql
   SELECT id, email, is_admin 
   FROM public.profiles 
   WHERE id = auth.uid();
   ```
   Debe retornar `is_admin = true`

2. **Verifica las políticas**:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```
   Debe incluir "Admins can view all profiles"

3. **Revisa los logs del servidor**:
   - Mira la consola del navegador (F12)
   - Mira los logs de Next.js
   - El error debería indicar el problema específico

---

**Fix implementado** ✅  
**Build exitoso** ✅  
**Listo para usar** ✅

