# 🔵 IMPLEMENTACIÓN GOOGLE OAUTH - ENCUENTRA.APP

Esta guía describe la implementación completa de Google OAuth para permitir que los usuarios se registren e inicien sesión con Google.

## ✅ IMPLEMENTACIÓN COMPLETADA

### Archivos Creados/Modificados

1. **`src/app/auth/callback/route.ts`** (NUEVO)
   - Ruta de callback que maneja el redirect de Google OAuth
   - Intercambia código por sesión
   - Verifica/crea perfil automáticamente
   - Redirige al dashboard

2. **`src/app/app/auth/login/page.tsx`** (MODIFICADO)
   - Agregado botón "Continuar con Google"
   - Manejo de estado de carga para Google OAuth
   - Integración con Supabase OAuth

3. **`src/app/app/auth/register/page.tsx`** (MODIFICADO)
   - Agregado botón "Continuar con Google"
   - Manejo de estado de carga para Google OAuth
   - Integración con Supabase OAuth

4. **`scripts/update-trigger-google-oauth.sql`** (NUEVO)
   - Script SQL para actualizar el trigger `handle_new_user`
   - Agrega soporte para `avatar_url` de Google
   - Maneja correctamente usuarios de Google OAuth

---

## 🔧 CONFIGURACIÓN REQUERIDA EN SUPABASE

### PASO 1: Habilitar Google Provider

1. Ve a tu **Supabase Dashboard**
2. Navega a **Authentication** > **Providers** (barra lateral izquierda)
3. Encuentra **Google** en la lista de proveedores
4. Haz clic en el toggle para **habilitar Google**
5. Configura:
   - **Client ID (for OAuth)**: Tu Google Client ID
   - **Client Secret (for OAuth)**: Tu Google Client Secret

> 📝 **Cómo obtener Google OAuth Credentials:**
> 1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
> 2. Crea un nuevo proyecto o selecciona uno existente
> 3. Habilita **Google+ API**
> 4. Ve a **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
> 5. Tipo: **Web application**
> 6. Authorized redirect URIs:
>    - `https://<tu-proyecto>.supabase.co/auth/v1/callback`
>    - `http://localhost:3000/auth/callback` (para desarrollo)
> 7. Copia el **Client ID** y **Client Secret**

### PASO 2: Configurar Redirect URLs

En Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
- Desarrollo: `http://localhost:3000`
- Producción: `https://tu-dominio.com`

**Redirect URLs (agregar):**
```
http://localhost:3000/auth/callback
https://tu-dominio.com/auth/callback
```

> ⚠️ **IMPORTANTE:** Supabase usa su propia URL de callback (`https://<proyecto>.supabase.co/auth/v1/callback`) para el OAuth flow, pero luego redirige a tu aplicación usando el `redirectTo` que especificamos en el código.

### PASO 3: Ejecutar Script SQL

1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Click en **+ New Query**
3. Copia TODO el contenido de `scripts/update-trigger-google-oauth.sql`
4. Pégalo en el editor
5. Click en **RUN**
6. Espera el mensaje "Success"

Este script:
- ✅ Agrega columna `avatar_url` a la tabla `profiles` si no existe
- ✅ Actualiza el trigger `handle_new_user` para soportar Google OAuth
- ✅ Maneja correctamente `avatar_url`, `full_name`, `name`, `picture` de Google

---

## 🧪 CÓMO PROBAR

### Prueba 1: Usuario Nuevo con Google

1. Ve a `http://localhost:3000/app/auth/login` o `/app/auth/register`
2. Haz clic en **"Continuar con Google"**
3. Selecciona una cuenta de Google
4. Autoriza la aplicación
5. Deberías ser redirigido a `/app/dashboard`
6. Verifica en Supabase:
   - **Authentication** > **Users**: Deberías ver el nuevo usuario con provider "google"
   - **Table Editor** > **profiles**: Deberías ver el perfil con:
     - `id`: UUID del usuario
     - `full_name`: Nombre de Google
     - `email`: Email de Google
     - `role`: "person" (default)
     - `avatar_url`: URL de la foto de perfil de Google

### Prueba 2: Usuario Existente (Vincular Cuenta)

1. Crea un usuario con email/password primero:
   - Email: `test@example.com`
   - Password: `Test123!@#`
2. Cierra sesión
3. Inicia sesión con Google usando el mismo email (`test@example.com`)
4. Supabase debería **vincular automáticamente** la cuenta
5. Deberías poder iniciar sesión con ambos métodos (password y Google)

### Prueba 3: Logout y Login

1. Inicia sesión con Google
2. Haz logout
3. Inicia sesión de nuevo con Google (debería ser instantáneo)
4. Verifica que tu sesión se mantiene

---

## 🔐 SEGURIDAD Y COMPATIBILIDAD

### ✅ Características Implementadas

- **Vincular cuentas automáticamente**: Si un usuario ya existe con email/password y luego usa Google con el mismo email, Supabase los vincula automáticamente
- **No duplicados**: El trigger y el callback verifican que no se creen perfiles duplicados
- **Preserva datos existentes**: 
  - `is_admin` NO se modifica nunca en este flujo
  - `is_premium` NO se modifica nunca en este flujo
  - `role` solo se asigna en usuarios nuevos (default: "person")
- **RLS funcionando**: Las políticas de seguridad siguen funcionando correctamente

### ⚠️ Campos Protegidos

Estos campos **NUNCA** se modifican en el flujo de Google OAuth:
- `is_admin` - Solo se puede cambiar manualmente por administradores
- `is_premium` - Solo se puede cambiar a través del sistema de pagos
- `role` - En actualizaciones (ON CONFLICT), se preserva el existente

### 🔄 Flujo de Usuario

```
Usuario hace clic en "Continuar con Google"
   ↓
Redirige a Google (OAuth)
   ↓
Usuario autoriza
   ↓
Google redirige a Supabase callback
   ↓
Supabase intercambia código por sesión
   ↓
Supabase redirige a /auth/callback
   ↓
Verificamos/creamos perfil (trigger automático + fallback manual)
   ↓
Redirigimos a /app/dashboard
```

---

## 🐛 TROUBLESHOOTING

### Error: "redirect_uri_mismatch"

**Causa:** La URL de redirect no está configurada correctamente en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console > Credentials > Tu OAuth Client
2. Agrega a **Authorized redirect URIs**:
   - `https://<tu-proyecto>.supabase.co/auth/v1/callback`

### Error: "Invalid client"

**Causa:** Client ID o Client Secret incorrectos en Supabase.

**Solución:**
1. Verifica que copiaste correctamente el Client ID y Secret
2. Asegúrate de que no hay espacios extra
3. Vuelve a pegar las credenciales en Supabase Dashboard

### Error: "Profile not found" o perfil no se crea

**Causa:** El trigger no se ejecutó o falló.

**Solución:**
1. Ejecuta el script `scripts/update-trigger-google-oauth.sql` de nuevo
2. Verifica que el trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. El callback tiene un fallback manual, pero el trigger debería manejarlo automáticamente

### El usuario se crea pero no tiene avatar_url

**Causa:** Google no proporcionó la foto o el campo no existe en la tabla.

**Solución:**
1. Ejecuta el script SQL de nuevo para asegurar que la columna existe
2. Verifica en Supabase que el usuario tiene `avatar_url` en `user_metadata`:
   ```sql
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'usuario@example.com';
   ```

### El usuario existente no se vincula con Google

**Causa:** Supabase debería vincular automáticamente si el email coincide, pero puede haber configuraciones que lo bloqueen.

**Solución:**
1. Verifica en Supabase Dashboard > Authentication > Settings que **"Enable email confirmations"** esté desactivado o configurado correctamente
2. Si el usuario tiene email no verificado, puede que no se vincule
3. En producción, asegúrate de que los emails estén verificados antes de intentar vincular

---

## 📝 NOTAS IMPORTANTES

1. **No hardcodear secrets**: Las credenciales de Google están en Supabase Dashboard, no en el código frontend.

2. **Redirect URL en desarrollo vs producción**:
   - Desarrollo: `http://localhost:3000/auth/callback`
   - Producción: `https://tu-dominio.com/auth/callback`
   - El código usa `window.location.origin` para detectar automáticamente

3. **Trigger automático**: El trigger `handle_new_user` se ejecuta automáticamente cuando se crea un usuario en `auth.users`, así que el perfil se crea sin intervención manual.

4. **Compatibilidad con usuarios existentes**: Los usuarios que ya tienen cuenta con email/password pueden usar Google con el mismo email y Supabase los vinculará automáticamente.

5. **Default role**: Los usuarios que se registran con Google obtienen `role = 'person'` por defecto. Si necesitas cambiarlo, deben actualizarlo en su perfil o a través del admin.

---

## ✅ CHECKLIST FINAL

Antes de considerar la implementación completa:

- [ ] Google OAuth configurado en Supabase Dashboard
- [ ] Client ID y Secret configurados correctamente
- [ ] Redirect URLs configuradas (local y producción)
- [ ] Script SQL ejecutado (`update-trigger-google-oauth.sql`)
- [ ] Probado registro nuevo con Google
- [ ] Probado login con Google para usuario existente
- [ ] Verificado que `avatar_url` se guarda correctamente
- [ ] Verificado que `is_admin` y `is_premium` NO se modifican
- [ ] Probado en local y producción (si aplica)

---

## 🎉 ESTADO FINAL

Al completar estos pasos, tendrás:

- ✅ Usuarios pueden registrarse con Google
- ✅ Usuarios pueden iniciar sesión con Google
- ✅ Perfil se crea automáticamente
- ✅ Avatar de Google se guarda en `avatar_url`
- ✅ No hay duplicados
- ✅ Usuarios existentes pueden vincular su cuenta de Google
- ✅ Estado admin/premium preservado
- ✅ Login existente sigue funcionando
- ✅ UX fluida y profesional

---

**¡Implementación completa! 🚀**









---

## La pantalla de Google dice "continuar a qjtmfywfnmjbiqdotncg.supabase.co"

Al iniciar sesión con Google, la pantalla de elegir cuenta muestra:

> Elige una cuenta para continuar a **qjtmfywfnmjbiqdotncg.supabase.co**

En vez de "continuar a **App Encuentra**".

### Por qué pasa

Ese texto lo pone Google, no la app, y **no se arregla con código**. Google
muestra el dominio del *redirect URI* que tiene registrado el cliente OAuth.
Ese redirect es el de Supabase — `https://<project-ref>.supabase.co/auth/v1/callback` —
porque Supabase es quien intermedia el login.

El `redirectTo` que pasa la app en `signInWithOAuth` (`/auth/callback`) es el
salto FINAL, después de Google y de Supabase. Google nunca lo ve.

Supabase lo advierte en su propia documentación: sin configurar esto, el
usuario ve el ID del proyecto, lo cual "no inspira confianza y hace la
aplicación más susceptible a intentos de phishing exitosos".

### Cómo arreglarlo (gratis)

En **Google Cloud Console**, sobre el proyecto que tiene el cliente OAuth:

1. **Verificar el dominio.** En Google Search Console, verificar la propiedad
   de `appencuentra.com`. Es el requisito para poder declararlo como dominio
   autorizado.

2. **Pantalla de consentimiento → Branding:**
   - *Nombre de la aplicación*: `App Encuentra` — este es el texto que
     reemplaza al subdominio de Supabase.
   - *Logo*: mínimo 120x120 px.
   - *Dominios autorizados*: agregar `appencuentra.com`.
   - *Enlaces*: política de privacidad (`/privacidad`) y términos
     (`/terminos`). Ya existen en la app.

3. **Publicar la aplicación.** Pasarla de "Testing" a "En producción". En modo
   de prueba sólo entran los usuarios de prueba declarados y el branding no se
   aplica como corresponde.

La verificación de marca por parte de Google puede tardar algunos días
hábiles. Para los permisos que pide esta app (sólo email y perfil básico) no
suele requerir revisión extendida.

### La alternativa de pago, y por qué no hace falta

Supabase ofrece un add-on de **Custom Domains** (~10 USD/mes) que mueve el
callback a `auth.appencuentra.com`. Es la solución más sólida —el usuario
nunca ve un dominio ajeno— y Supabase la recomienda como primera opción.

Pero **no es necesaria sólo para cambiar el nombre**: configurar el branding
del paso anterior ya hace que Google muestre "App Encuentra" con su logo.
La diferencia es que con custom domain también cambia el dominio técnico que
aparece en la barra durante el salto.

### Qué NO intentar

- Cambiar `redirectTo` en `signInWithOAuth`. No afecta a esta pantalla: Google
  ni lo ve.
- Cambiar el nombre del proyecto en Supabase. El subdominio del proyecto no se
  puede renombrar.
