# 🔧 Solución: Sistema de Recuperación de Contraseña

## ❌ Problema

El usuario recibe el correo con el link de recuperación, pero el link no lo lleva a ningún lado o no funciona correctamente.

---

## ✅ Solución Implementada

Se ha mejorado el manejo del token de recuperación en la página de reset-password para que funcione correctamente con Supabase.

### **Cambios Realizados:**

1. **Mejor detección del token**:
   - Busca el token tanto en `window.location.hash` como en `window.location.search`
   - Maneja ambos formatos que Supabase puede usar

2. **Múltiples intentos de verificación**:
   - Hace hasta 5 intentos para establecer la sesión
   - Espera entre intentos para dar tiempo a que Supabase procese el token

3. **Mejor logging**:
   - Agrega logs en consola para debugging
   - Muestra qué está pasando en cada paso

4. **Mejor manejo de errores**:
   - Diferencia entre diferentes tipos de errores
   - Mensajes más claros para el usuario

---

## 🚀 Configuración Requerida en Supabase

### **PASO 1: Configurar URLs de Redirección**

1. Ve a **Supabase Dashboard**
2. Ve a **Authentication** → **URL Configuration**
3. En **Redirect URLs**, agrega estas URLs (una por línea):

```
http://localhost:3000/app/auth/reset-password
https://tu-dominio.com/app/auth/reset-password
http://localhost:3000/app/auth/reset-password#
https://tu-dominio.com/app/auth/reset-password#
```

**IMPORTANTE**: Incluye tanto la versión sin `#` como con `#` porque Supabase puede usar ambos formatos.

4. Click en **Save**

### **PASO 2: Verificar Site URL**

1. En **Authentication** → **URL Configuration**
2. Verifica que **Site URL** esté configurada correctamente:
   - Desarrollo: `http://localhost:3000`
   - Producción: `https://tu-dominio.com`

### **PASO 3: Verificar Template de Email**

1. Ve a **Authentication** → **Email Templates**
2. Click en **Reset Password**
3. Verifica que el link en el template sea:

```
{{ .ConfirmationURL }}
```

O si usas un link personalizado:

```
{{ .SiteURL }}/app/auth/reset-password?token={{ .TokenHash }}&type=recovery
```

**NOTA**: Se recomienda usar `{{ .ConfirmationURL }}` que Supabase genera automáticamente.

---

## 🧪 Cómo Probar

### **1. Solicitar recuperación**

1. Ve a `/app/auth/forgot-password`
2. Ingresa un email registrado
3. Click en "Enviar instrucciones"
4. ✅ Debes ver el mensaje de éxito

### **2. Revisar el correo**

1. Abre tu bandeja de entrada
2. Busca el correo de Supabase
3. ✅ Debe contener un link para resetear la contraseña

### **3. Hacer click en el link**

1. Click en el link del correo
2. ✅ Debes ser redirigido a `/app/auth/reset-password`
3. ✅ La URL debe limpiarse automáticamente (sin mostrar el token)
4. ✅ No debe aparecer ningún error

### **4. Resetear la contraseña**

1. Ingresa una nueva contraseña
2. Confirma la contraseña
3. Click en "Restablecer contraseña"
4. ✅ Debes ver el mensaje de éxito
5. ✅ Debes ser redirigido al login automáticamente

---

## 🐛 Solución de Problemas

### **Problema: El link del correo no funciona / da error 404**

**Causa**: La URL de redirección no está configurada en Supabase

**Solución**:
1. Verifica que hayas agregado la URL en **Redirect URLs** (Paso 1)
2. Asegúrate de que la URL sea exactamente igual (incluyendo `/app/auth/reset-password`)
3. Guarda los cambios en Supabase

### **Problema: El link me lleva a la página pero aparece error "No hay sesión válida"**

**Causa**: El token no se procesó correctamente

**Solución**:
1. Abre la consola del navegador (F12)
2. Revisa los logs que empiezan con 🔍, ✅, ❌
3. Verifica que el token esté presente en la URL
4. Intenta solicitar un nuevo link si el anterior expiró (expiran en 1 hora)

### **Problema: El link me redirige a otra página o a Supabase**

**Causa**: La Site URL no está configurada correctamente

**Solución**:
1. Ve a **Authentication** → **URL Configuration**
2. Verifica que **Site URL** sea correcta
3. Si estás en desarrollo, debe ser `http://localhost:3000`
4. Si estás en producción, debe ser tu dominio completo

### **Problema: El correo no llega**

**Causa**: Problema con el servicio de email de Supabase

**Solución**:
1. Revisa la carpeta de spam
2. Verifica que el email esté registrado en Supabase
3. Revisa los logs de Supabase Dashboard → **Authentication** → **Logs**

---

## 📋 Verificación Final

Para verificar que todo está configurado correctamente:

1. ✅ **Redirect URLs configuradas** en Supabase
2. ✅ **Site URL configurada** correctamente
3. ✅ **Email template** usa `{{ .ConfirmationURL }}`
4. ✅ **El link del correo** funciona y redirige correctamente
5. ✅ **La página de reset** muestra el formulario sin errores
6. ✅ **Se puede cambiar la contraseña** exitosamente

---

## 📝 Archivos Modificados

- `src/app/app/auth/reset-password/page.tsx`
  - Mejorado el manejo del token de recuperación
  - Múltiples intentos de verificación de sesión
  - Mejor logging y manejo de errores

---

**La recuperación de contraseña ahora debe funcionar correctamente** ✅

**IMPORTANTE**: Asegúrate de configurar las URLs de redirección en Supabase Dashboard siguiendo el Paso 1.

