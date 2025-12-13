# 🔧 Fix Completo: Permisos de Administrador

## ❌ Problema Identificado

Los usuarios administradores (`is_admin = TRUE` en la base de datos) no se reflejan como administradores en la aplicación. El problema puede estar en:

1. **Lectura de `is_admin` desde el cliente**: Puede fallar por políticas RLS
2. **El código no muestra correctamente el estado de admin**

---

## ✅ Solución Implementada

### **BLOQUE 1: Auditoría de Código** ✅

**Resultado**: Los botones Verificar y Suspender **SOLO modifican la tabla `businesses`**, NO tocan `profiles`. Esto está correcto.

**Archivos auditados**:
- ✅ `src/app/api/admin/business/verificar/route.ts` - Solo modifica `businesses`
- ✅ `src/app/api/admin/business/suspender/route.ts` - Solo modifica `businesses`
- ✅ Ningún código modifica `profiles.is_admin` o `profiles.role` directamente

### **BLOQUE 2: Comentarios de Seguridad** ✅

Agregados comentarios de seguridad en:
- ✅ `src/app/api/admin/business/verificar/route.ts`
- ✅ `src/app/api/admin/business/suspender/route.ts`

**Comentarios agregados**:
```typescript
// ⚠️ IMPORTANTE: Esta acción SOLO modifica campos relacionados con Premium/Verificación en businesses
// NO debe modificar la tabla profiles, is_admin, role, ni ningún campo del perfil del usuario
```

### **BLOQUE 3: API Route para Leer is_admin** ✅

Creada nueva API route: `src/app/api/user/is-admin/route.ts`

**Función**: Lee `is_admin` desde el servidor (evita problemas de RLS del cliente)

### **BLOQUE 4: Actualizar Código de Perfil** ✅

Actualizado `src/app/app/dashboard/perfil/page.tsx` para usar la API route en lugar de lectura directa.

**Antes**:
```typescript
const { data } = await supabase
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single()
```

**Ahora**:
```typescript
const response = await fetch('/api/user/is-admin')
const data = await response.json()
```

### **BLOQUE 5: Script para Restaurar Permisos** ✅

Creado `scripts/restore-admin-mantonio-safe.sql` para restaurar permisos de admin de forma segura.

---

## 🚀 Pasos para Solucionar

### **PASO 1: Restaurar Permisos de Admin**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre `scripts/restore-admin-mantonio-safe.sql`
3. Ejecuta el script completo
4. Verifica que aparezca: `✅ ADMINISTRADOR RESTAURADO CORRECTAMENTE`

### **PASO 2: Cerrar Sesión y Volver a Iniciar**

1. Cierra sesión completamente en la aplicación
2. Limpia el cache del navegador (opcional pero recomendado)
3. Inicia sesión nuevamente con `mantoniorodriguez94@gmail.com`

### **PASO 3: Verificar que Funciona**

1. Ve a `/app/dashboard/perfil`
2. ✅ Debe aparecer el badge "🔥 Administrador"
3. ✅ Debe aparecer el botón "Panel de Control Admin"
4. Click en "Panel de Control Admin"
5. ✅ Debe redirigir a `/app/admin` sin errores

---

## 📦 Archivos Modificados

1. **`src/app/api/user/is-admin/route.ts`** (NUEVO)
   - API route para leer `is_admin` desde el servidor

2. **`src/app/app/dashboard/perfil/page.tsx`** (MODIFICADO)
   - Usa API route en lugar de lectura directa de `is_admin`

3. **`src/app/api/admin/business/verificar/route.ts`** (MODIFICADO)
   - Agregados comentarios de seguridad

4. **`src/app/api/admin/business/suspender/route.ts`** (MODIFICADO)
   - Agregados comentarios de seguridad

5. **`scripts/restore-admin-mantonio-safe.sql`** (NUEVO)
   - Script para restaurar permisos de admin de forma segura

---

## 🔍 Verificación en Base de Datos

Ejecuta este query en Supabase para verificar:

```sql
SELECT 
  u.email,
  p.is_admin,
  p.role,
  CASE 
    WHEN p.is_admin = TRUE THEN '✅ ES ADMIN'
    ELSE '❌ NO ES ADMIN'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mantoniorodriguez94@gmail.com';
```

Debe mostrar:
- `is_admin`: `true`
- `role`: `person` o `company` (según corresponda)
- `estado`: `✅ ES ADMIN`

---

## 🛡️ Protecciones Implementadas

### **1. Updates Aislados**

Los botones Verificar y Suspender solo modifican campos específicos de `businesses`:
- ✅ **Verificar**: Solo `is_verified`, `verified_at`, `verified_by`
- ✅ **Suspender**: Solo `is_premium`

**NO tocan**:
- ❌ `profiles` table
- ❌ `is_admin`
- ❌ `role`
- ❌ Campos del usuario

### **2. Lectura Segura de is_admin**

El código ahora usa una API route del servidor para leer `is_admin`, evitando problemas de RLS.

### **3. Comentarios de Seguridad**

Cada función que modifica datos tiene comentarios claros indicando qué campos modifica y cuáles NO debe tocar.

---

## 🐛 Solución de Problemas

### **Problema: Badge "Administrador" no aparece**

**Causa**: `is_admin` no se está leyendo correctamente

**Solución**:
1. Verifica en la base de datos que `is_admin = TRUE`
2. Ejecuta `scripts/restore-admin-mantonio-safe.sql`
3. Cierra sesión y vuelve a iniciar
4. Abre la consola del navegador (F12) y verifica que no haya errores

### **Problema: Botón "Panel de Control Admin" no aparece**

**Causa**: El estado `isAdmin` no se está actualizando

**Solución**:
1. Recarga la página
2. Verifica en la consola que la API route `/api/user/is-admin` retorne `isAdmin: true`
3. Verifica que no haya errores de CORS o autenticación

### **Problema: Error al acceder a /app/admin**

**Causa**: `checkAdminAuth()` no está funcionando correctamente

**Solución**:
1. Verifica los logs del servidor Next.js
2. Ejecuta el script de restauración nuevamente
3. Verifica que las políticas RLS permitan leer `is_admin`

---

## ✅ Checklist de Verificación

- [ ] `is_admin = TRUE` en la tabla `profiles` para el usuario
- [ ] Script `restore-admin-mantonio-safe.sql` ejecutado
- [ ] Sesión cerrada y vuelta a iniciar
- [ ] Badge "🔥 Administrador" aparece en el perfil
- [ ] Botón "Panel de Control Admin" aparece
- [ ] Acceso a `/app/admin` funciona correctamente
- [ ] Los botones Verificar/Suspender NO afectan permisos admin

---

## 📝 Reglas de Seguridad Implementadas

1. **Nunca usar `.update(profile)` completo**
   - Siempre usar updates parciales
   - Documentar qué campos se modifican

2. **Aislar lógica de Premium**
   - Premium solo afecta `businesses.is_premium`
   - NO afecta `profiles.is_admin` ni `profiles.role`

3. **Lectura segura de permisos**
   - Usar API routes del servidor
   - No depender de lectura directa desde cliente

---

**El sistema ahora está protegido contra modificaciones accidentales de permisos de administrador** ✅

