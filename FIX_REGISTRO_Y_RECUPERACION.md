# 🔧 Correcciones: Registro de Usuarios y Recuperación de Contraseña

## ✅ Problemas Identificados y Corregidos

### 1. **Registro de Usuarios**
- ❌ **Problema**: El email no se guardaba en la tabla `profiles`
- ✅ **Solución**: Actualizado el trigger para incluir el email automáticamente

### 2. **Recuperación de Contraseña**
- ❌ **Problema**: No manejaba correctamente los tokens de Supabase
- ✅ **Solución**: Mejorado el manejo de tokens y sesiones

---

## 🚀 Pasos para Aplicar las Correcciones

### PASO 1: Actualizar la Base de Datos

Ejecuta el siguiente script SQL en Supabase:

**Opción A: Si ya tienes usuarios registrados**
```sql
-- Ejecuta: scripts/fix-profiles-email.sql
```

**Opción B: Si es una instalación nueva**
```sql
-- Ejecuta: supabase-setup.sql (ya actualizado)
```

**Pasos:**
1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Click en **+ New Query**
3. Copia y pega el contenido del script
4. Click en **RUN**
5. Verifica que no haya errores

### PASO 2: Configurar URLs de Redirección en Supabase

1. Ve a **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Agrega estas URLs en **Redirect URLs**:
   ```
   http://localhost:3000/app/auth/reset-password
   https://tu-dominio.com/app/auth/reset-password
   ```
3. Click en **Save**

### PASO 3: Verificar Configuración de Email

1. Ve a **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Verifica que el template de **Reset Password** tenga la URL correcta:
   ```
   {{ .SiteURL }}/app/auth/reset-password
   ```
3. Si usas confirmación de email, desactívala temporalmente:
   - **Authentication** > **Providers** > **Email**
   - **DESMARCAR** "Confirm email"

---

## 📋 Cambios Realizados en el Código

### 1. **Registro (`src/app/app/auth/register/page.tsx`)**
- ✅ Verifica que el perfil se haya creado después del registro
- ✅ Mejor manejo de errores
- ✅ Logging para debugging

### 2. **Recuperación de Contraseña (`src/app/app/auth/forgot-password/page.tsx`)**
- ✅ Mejor manejo de errores específicos
- ✅ Mensajes de error más claros
- ✅ Manejo de rate limiting

### 3. **Reset de Contraseña (`src/app/app/auth/reset-password/page.tsx`)**
- ✅ Manejo correcto de tokens en URL (hash y query params)
- ✅ Verificación de sesión antes de cambiar contraseña
- ✅ Cierre de sesión después de cambiar contraseña
- ✅ Mejor manejo de errores

---

## 🧪 Cómo Probar

### Probar Registro:
1. Ve a `/app/auth/register`
2. Completa el formulario:
   - Nombre: Test User
   - Email: test@example.com
   - Contraseña: Test123!@#
   - Confirmar: Test123!@#
3. Click en "Crear cuenta"
4. Verifica en Supabase:
   - **Authentication** > **Users**: Debe aparecer el usuario
   - **Table Editor** > **profiles**: Debe tener `id`, `full_name`, `email`, `role`

### Probar Recuperación de Contraseña:
1. Ve a `/app/auth/forgot-password`
2. Ingresa un email registrado
3. Click en "Enviar instrucciones"
4. Revisa el correo (o Supabase logs si estás en desarrollo)
5. Click en el enlace del correo
6. Debe redirigir a `/app/auth/reset-password`
7. Ingresa nueva contraseña
8. Debe redirigir al login

---

## 🔍 Verificar que Todo Funciona

### En Supabase Dashboard:

**1. Verificar tabla profiles:**
```sql
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**2. Verificar trigger:**
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**3. Verificar función:**
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

---

## 🐛 Solución de Problemas

### Error: "No se pudo verificar el perfil"
- **Causa**: El trigger no se ejecutó
- **Solución**: Ejecuta el script SQL de nuevo

### Error: "Enlace inválido o expirado"
- **Causa**: El token expiró o la URL de redirección no está configurada
- **Solución**: 
  1. Verifica las URLs en Supabase > Authentication > URL Configuration
  2. Solicita un nuevo enlace de recuperación

### Error: "No hay una sesión válida"
- **Causa**: El token no se procesó correctamente
- **Solución**: Asegúrate de hacer click en el enlace del correo, no copiarlo manualmente

### Los usuarios no se guardan en profiles
- **Causa**: El trigger no está funcionando
- **Solución**: 
  1. Ejecuta el script SQL
  2. Verifica que el trigger exista
  3. Revisa los logs de Supabase para errores

---

## 📝 Notas Importantes

1. **Email en profiles**: Ahora se guarda automáticamente cuando se registra un usuario
2. **Tokens de recuperación**: Expiran después de 1 hora por defecto
3. **Rate limiting**: Supabase limita las solicitudes de recuperación para prevenir spam
4. **Confirmación de email**: Si está activada, los usuarios deben confirmar antes de poder usar recuperación de contraseña

---

## ✅ Checklist Final

- [ ] Script SQL ejecutado en Supabase
- [ ] URLs de redirección configuradas
- [ ] Email template verificado
- [ ] Registro de usuario probado
- [ ] Perfil creado correctamente en base de datos
- [ ] Recuperación de contraseña probada
- [ ] Reset de contraseña funciona correctamente

---

**¡Todo listo!** 🎉

Si encuentras algún problema, revisa los logs de Supabase y la consola del navegador para más detalles.

