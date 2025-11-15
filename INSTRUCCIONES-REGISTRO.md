# 🔧 SOLUCIÓN: Registro de Usuarios en Encuentra

## ✅ CAMBIOS REALIZADOS

### 1. **Archivo de Registro Simplificado** (`src/app/app/auth/register/page.tsx`)
- ✅ Eliminé dependencia de tabla `profiles` durante el registro
- ✅ El rol se guarda en `user_metadata` de Supabase Auth
- ✅ Flujo simplificado: registro → sesión → dashboard
- ✅ Manejo correcto de confirmación de email

### 2. **SQL de Configuración** (`supabase-setup.sql`)
- ✅ Crea tabla `profiles` automáticamente
- ✅ Trigger que crea perfil cuando se registra un usuario
- ✅ Políticas de seguridad (RLS) configuradas
- ✅ Soporte para roles: `person` y `company`

---

## 🚀 PASOS PARA ACTIVAR EL REGISTRO

### PASO 1: Configurar Supabase

1. Ve a tu **Supabase Dashboard**
2. Click en **SQL Editor** (barra lateral izquierda)
3. Click en **+ New Query**
4. Copia TODO el contenido de `supabase-setup.sql`
5. Pégalo en el editor
6. Click en **RUN** (esquina inferior derecha)
7. Espera el mensaje "Success"

### PASO 2: Desactivar Confirmación de Email (IMPORTANTE)

1. En Supabase Dashboard, ve a **Authentication** > **Providers**
2. Click en **Email**
3. **DESMARCA** la opción **"Confirm email"**
4. Click en **Save**

> ⚠️ **Sin este paso, los usuarios NO podrán iniciar sesión inmediatamente después del registro**

### PASO 3: Verificar `.env.local`

Asegúrate de tener:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-aqui
```

### PASO 4: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

---

## 🧪 CÓMO PROBAR

1. Ve a `http://localhost:3000/app/auth/register`
2. Completa el formulario:
   - **Nombre completo**: Juan Pérez
   - **Email**: test@test.com
   - **Contraseña**: Test123!@#
   - **Confirmar contraseña**: Test123!@#
   - **Tipo de usuario**: Soy una persona
3. Click en **"Crear cuenta"**
4. Deberías ser redirigido a `/app/dashboard` automáticamente

---

## 🔍 VERIFICAR QUE TODO FUNCIONA

### En Supabase Dashboard:

1. **Authentication** > **Users**: Deberías ver el nuevo usuario
2. **Table Editor** > **profiles**: Deberías ver su perfil con:
   - `id`: UUID del usuario
   - `full_name`: Nombre completo
   - `role`: "person" o "company"
   - `created_at`: Fecha de creación

---

## 🐛 SI AÚN TIENES PROBLEMAS

### Error: "Error guardando información del usuario"
- **Causa**: El trigger no se ejecutó o la tabla no existe
- **Solución**: Ejecuta el SQL de nuevo en Supabase

### Error: "User already registered"
- **Causa**: El email ya fue usado
- **Solución**: Usa otro email o elimina el usuario en Supabase > Authentication > Users

### No redirige al dashboard
- **Causa**: Confirmación de email está activada
- **Solución**: Ve al PASO 2 y desactívala

### "Invalid login credentials"
- **Causa**: El usuario no confirmó su email
- **Solución**: Desactiva confirmación de email (PASO 2) y registra de nuevo

---

## 📊 CÓMO FUNCIONA AHORA

```
REGISTRO
   ↓
Supabase Auth crea usuario
   ↓
Metadata: { full_name, role }
   ↓
Trigger crea registro en profiles
   ↓
Usuario obtiene sesión activa
   ↓
Redirige a /app/dashboard
```

---

## 🎯 DASHBOARDS POR TIPO DE USUARIO

Por ahora, todos van a `/app/dashboard`.

Si quieres dashboards diferentes según el rol, avísame y lo implemento.

---

## ✅ RESUMEN

El registro ahora es **100% funcional** si sigues estos pasos:
1. ✅ Ejecutar `supabase-setup.sql`
2. ✅ Desactivar confirmación de email
3. ✅ Reiniciar servidor
4. ✅ Probar registro

**¡Eso es todo!** 🎉

