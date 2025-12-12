# 🗑️ Funcionalidad: Eliminar Cuenta

## 📋 Resumen

Se ha implementado la funcionalidad para que los usuarios puedan eliminar su cuenta permanentemente desde su perfil.

---

## ✅ Funcionalidades Implementadas

### **1. Botón "Eliminar Cuenta"**
- Ubicado en `/app/dashboard/perfil`
- Aparece **antes** del botón "Cerrar Sesión"
- Estilo destacado en rojo para indicar acción peligrosa

### **2. Modal de Confirmación**
- Muestra advertencia clara sobre la acción permanente
- Lista todos los datos que se eliminarán:
  - Cuenta y perfil
  - Todos los negocios (si tiene)
  - Todos los mensajes y conversaciones
  - Todas las reseñas
  - Todos los datos relacionados
- Requiere confirmación explícita del usuario

### **3. Eliminación Completa**
- Elimina el usuario de `auth.users` (Supabase Auth)
- El perfil se elimina automáticamente (CASCADE)
- Todos los datos relacionados se eliminan por CASCADE:
  - Negocios del usuario
  - Mensajes y conversaciones
  - Reseñas
  - Otros datos relacionados

---

## 🚀 Configuración Requerida

### **IMPORTANTE: Variable de Entorno**

Para que la eliminación funcione, necesitas agregar la **Service Role Key** de Supabase:

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Copia la **`service_role` key** (NO la `anon` key)
3. Agrega esta variable a tu archivo `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

⚠️ **ADVERTENCIA DE SEGURIDAD:**
- La Service Role Key debe **NUNCA** estar en código del cliente
- Solo se usa en el servidor (API routes)
- No la compartas ni la expongas públicamente

---

## 📦 Archivos Creados/Modificados

### **Nuevos Archivos:**

1. **`src/app/api/user/delete-account/route.ts`**
   - API route que maneja la eliminación de cuenta
   - Usa Service Role Key para eliminar usuarios
   - Verifica autenticación antes de eliminar

### **Archivos Modificados:**

1. **`src/app/app/dashboard/perfil/page.tsx`**
   - Agregado botón "Eliminar Cuenta"
   - Agregado modal de confirmación
   - Agregada función `handleDeleteAccount()`
   - Agregados estados: `showDeleteModal`, `deleting`, `deleteError`

---

## 🎯 Flujo de Eliminación

1. **Usuario hace click en "Eliminar Cuenta"**
   - Se abre el modal de confirmación

2. **Usuario lee la advertencia**
   - Ve qué datos se eliminarán
   - Decide confirmar o cancelar

3. **Usuario confirma eliminación**
   - Click en "Sí, eliminar mi cuenta"
   - Se envía request a `/api/user/delete-account`

4. **Backend procesa la eliminación**
   - Verifica que el usuario esté autenticado
   - Usa Service Role Key para eliminar el usuario
   - Supabase elimina automáticamente:
     - Usuario de `auth.users`
     - Perfil de `profiles` (CASCADE)
     - Datos relacionados (CASCADE)

5. **Resultado**
   - Si es exitoso: Cierra sesión y redirige a login
   - Si hay error: Muestra mensaje de error en el modal

---

## 🧪 Cómo Probar

### **1. Verificar que el botón aparece**

1. Inicia sesión con cualquier usuario
2. Ve a `/app/dashboard/perfil`
3. ✅ Debe aparecer el botón "Eliminar Cuenta" antes de "Cerrar Sesión"

### **2. Verificar modal de confirmación**

1. Click en "Eliminar Cuenta"
2. ✅ Debe abrirse el modal con:
   - Título "Eliminar Cuenta"
   - Advertencia de acción permanente
   - Lista de datos que se eliminarán
   - Botones "Sí, eliminar mi cuenta" y "Cancelar"

### **3. Verificar eliminación (con cuenta de prueba)**

1. Crea una cuenta de prueba
2. Click en "Eliminar Cuenta"
3. Confirma la eliminación
4. ✅ Debe:
   - Mostrar "Eliminando cuenta..." mientras procesa
   - Cerrar sesión automáticamente
   - Redirigir a `/app/auth/login`
   - El usuario ya no debe poder iniciar sesión

### **4. Verificar cancelación**

1. Click en "Eliminar Cuenta"
2. Click en "Cancelar"
3. ✅ El modal debe cerrarse sin cambios

---

## ⚠️ Notas Importantes

### **Eliminación en Cascada**

La eliminación es **completa y permanente**. Cuando se elimina un usuario:

- ✅ Se elimina de `auth.users`
- ✅ Se elimina su perfil de `profiles` (por CASCADE)
- ✅ Se eliminan todos sus negocios (por CASCADE si `owner_id` tiene `ON DELETE CASCADE`)
- ✅ Se eliminan todas sus conversaciones (por CASCADE si `user_id` tiene `ON DELETE CASCADE`)
- ✅ Se eliminan todos sus mensajes (por CASCADE si `sender_id` tiene `ON DELETE CASCADE`)
- ✅ Se eliminan todas sus reseñas (por CASCADE si `user_id` tiene `ON DELETE CASCADE`)

### **Verificar Constraints de Base de Datos**

Asegúrate de que las tablas relacionadas tengan `ON DELETE CASCADE` configurado correctamente:

```sql
-- Verificar constraints
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'profiles'
  AND ccu.column_name = 'id';
```

---

## 🔒 Seguridad

- ✅ Solo usuarios autenticados pueden eliminar su propia cuenta
- ✅ La Service Role Key solo se usa en el servidor (nunca en cliente)
- ✅ Se requiere confirmación explícita antes de eliminar
- ✅ El modal muestra claramente qué se eliminará

---

## 🐛 Solución de Problemas

### **Error: "SUPABASE_SERVICE_ROLE_KEY no está configurado"**

**Causa**: Falta la variable de entorno

**Solución**: 
1. Agrega `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`
2. Reinicia el servidor de desarrollo

### **Error: "Error al eliminar la cuenta"**

**Causa**: Puede ser por permisos o constraints de base de datos

**Solución**:
1. Verifica que la Service Role Key sea correcta
2. Verifica los logs del servidor para más detalles
3. Verifica que las tablas relacionadas tengan `ON DELETE CASCADE`

### **El usuario se elimina pero quedan datos huérfanos**

**Causa**: Falta `ON DELETE CASCADE` en algunas relaciones

**Solución**: 
1. Ejecuta scripts SQL para agregar CASCADE a las relaciones faltantes
2. O elimina manualmente los datos huérfanos después

---

## ✅ Estado Final

- ✅ Botón "Eliminar Cuenta" implementado
- ✅ Modal de confirmación con advertencias
- ✅ API route para eliminar cuenta
- ✅ Manejo de errores
- ✅ Eliminación completa y permanente
- ✅ Build exitoso sin errores

---

**La funcionalidad de eliminar cuenta está completamente implementada y lista para usar** ✅

