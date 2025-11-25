# 🔒 Sistema de Permisos: Solo Admins Editan Reviews

## 📋 Cambios Implementados

### ✅ Lo Que Se Modificó

He configurado el sistema para que **solo los administradores puedan editar reseñas**:

#### **Frontend (Interface)**
1. ✅ **Usuarios regulares**: Ven "Dejar una reseña" (solo si no tienen review)
2. ✅ **Usuarios con review**: Ven mensaje "Ya dejaste tu reseña" ✓
3. ✅ **Administradores**: Ven "Editar reseña (Admin)" con botón naranja
4. ✅ **Dueños de negocio**: No pueden dejar reviews en su propio negocio

#### **Backend (Base de datos)**
1. 🔒 **Política RLS**: Solo admins pueden UPDATE en reviews
2. 🔒 **Política RLS**: Solo admins pueden DELETE reviews
3. ✅ **Cualquier usuario**: Puede INSERT (crear) reviews nuevas

## 🎯 Matriz de Permisos

| Acción | Usuario Regular | Usuario con Review | Dueño del Negocio | Administrador |
|--------|----------------|-------------------|-------------------|---------------|
| **Ver reviews** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Crear review nueva** | ✅ Sí | ❌ No (ya tiene una) | ❌ No (es su negocio) | ✅ Sí |
| **Editar su review** | ❌ No | ❌ No | ❌ No | ✅ Sí |
| **Eliminar review** | ❌ No | ❌ No | ❌ No | ✅ Sí |

## 🖥️ Cambios Visuales

### **Usuario Regular SIN Review**
```
┌─────────────────────────────────────────────┐
│ Reseñas y Calificaciones                    │
│ Descubre qué opinan los clientes...         │
│                                              │
│                    [⭐ Dejar una reseña]     │  ← Botón TEAL
└─────────────────────────────────────────────┘
```

### **Usuario Regular CON Review**
```
┌─────────────────────────────────────────────┐
│ Reseñas y Calificaciones                    │
│ Descubre qué opinan los clientes...         │
│                                              │
│                  [✓ Ya dejaste tu reseña]   │  ← Badge gris
└─────────────────────────────────────────────┘
```

### **Administrador CON Review Existente**
```
┌─────────────────────────────────────────────┐
│ Reseñas y Calificaciones                    │
│ Descubre qué opinan los clientes...         │
│                                              │
│              [✏️ Editar reseña (Admin)]     │  ← Botón NARANJA
└─────────────────────────────────────────────┘
```

### **Dueño del Negocio**
```
┌─────────────────────────────────────────────┐
│ Reseñas y Calificaciones                    │
│ Descubre qué opinan los clientes...         │
│                                              │
│                     (sin botones)            │
└─────────────────────────────────────────────┘
```

## 🚀 Cómo Aplicar los Cambios

### Paso 1: Actualizar Base de Datos (IMPORTANTE)

```bash
1. Abre Supabase Dashboard → SQL Editor
2. Ejecuta el script: scripts/reviews-solo-admin-edita.sql
3. Verás: "✅ Políticas de seguridad actualizadas"
```

### Paso 2: Reiniciar Servidor

```bash
# En tu terminal:
npm run dev
```

### Paso 3: Probar que Funciona

```bash
✓ Usuario regular: Publica una review
✓ Usuario regular: Intenta editar (no debería ver botón)
✓ Admin: Publica una review  
✓ Admin: Edita una review (debería funcionar)
```

## 🧪 Pruebas de Seguridad

### Test 1: Usuario Regular Intenta Editar (Frontend)

**Esperado:**
- ❌ No ve botón "Editar mi reseña"
- ✅ Ve mensaje "Ya dejaste tu reseña"

### Test 2: Usuario Regular Intenta Editar (Backend)

**Simular intento malicioso:**
```sql
-- Como usuario regular, intentar actualizar una review
UPDATE public.reviews 
SET comment = 'Intento de edición maliciosa'
WHERE user_id = auth.uid();

-- Resultado esperado: ERROR - permission denied
```

### Test 3: Administrador Edita Review

**Esperado:**
- ✅ Ve botón "Editar reseña (Admin)" en NARANJA
- ✅ Puede abrir el formulario
- ✅ Puede guardar cambios exitosamente

## 🔐 Seguridad de Doble Capa

Este sistema usa **doble protección**:

### Capa 1: Frontend (UI)
```typescript
// Solo muestra botón de editar si es admin
{user && !isOwner && userReview && isAdmin && (
  <button>Editar reseña (Admin)</button>
)}
```

### Capa 2: Backend (RLS)
```sql
-- Solo permite UPDATE si es admin
CREATE POLICY "Only admins can update reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'is_admin')::boolean 
     FROM auth.users 
     WHERE id = auth.uid()) = true
  );
```

**Resultado:** Incluso si alguien manipula el frontend, el backend rechazará la operación.

## 📝 Flujo Completo de Usuario Regular

```
1. Usuario abre un negocio
   ↓
2. Ve reviews existentes
   ↓
3. ¿Tiene review?
   │
   ├─ NO → Ve botón "Dejar una reseña"
   │        ↓
   │        Click → Publica review
   │        ↓
   │        ✅ Review publicada
   │
   └─ SÍ → Ve "Ya dejaste tu reseña" ✓
            ↓
            (No puede editar, solo ver)
```

## 🛡️ Flujo Completo de Administrador

```
1. Admin abre un negocio
   ↓
2. Ve reviews existentes
   ↓
3. ¿Tiene review?
   │
   ├─ NO → Ve botón "Dejar una reseña"
   │        ↓
   │        Click → Publica review
   │
   └─ SÍ → Ve "Editar reseña (Admin)"
            ↓
            Click → Abre formulario pre-llenado
            ↓
            Modifica rating/comentario
            ↓
            ✅ Review actualizada
```

## ⚠️ Consideraciones Importantes

### 1. **¿Cómo Identificar Admins?**

Los administradores tienen en su metadata:
```json
{
  "user_metadata": {
    "is_admin": true,
    "role": "company" // o "person"
  }
}
```

### 2. **¿Cómo Crear un Admin?**

Ejecuta en Supabase SQL Editor:
```sql
UPDATE auth.users 
SET raw_user_meta_data = 
  raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@ejemplo.com';
```

### 3. **¿Los Usuarios Pueden Eliminar Sus Reviews?**

**No.** Solo los administradores pueden eliminar reviews.

Si quieres permitir que usuarios eliminen sus propias reviews:
```sql
-- Ejecuta esto en Supabase
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 🔄 Revertir Cambios (Si es Necesario)

Si quieres que usuarios puedan editar sus propias reviews:

```sql
-- Ejecuta en Supabase SQL Editor
DROP POLICY IF EXISTS "Only admins can update reviews" ON public.reviews;

CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);
```

Luego actualiza el código:
```typescript
// En page.tsx, cambia:
{user && !isOwner && userReview && isAdmin && (
// Por:
{user && !isOwner && userReview && (
```

## ✅ Checklist de Verificación

Después de implementar los cambios:

```bash
□ Ejecuté el script SQL de seguridad
□ Reinicié el servidor (npm run dev)
□ Como usuario regular SIN review: veo botón "Dejar una reseña"
□ Como usuario regular CON review: veo mensaje "Ya dejaste tu reseña"
□ Como usuario regular CON review: NO veo botón de editar
□ Como admin CON review: veo botón "Editar reseña (Admin)" naranja
□ Como admin: puedo editar reviews exitosamente
□ Como dueño de negocio: NO veo botones de review
```

## 🎨 Colores de los Botones

Para fácil identificación:

| Tipo de Botón | Color | Usuario |
|---------------|-------|---------|
| "Dejar una reseña" | 🟢 Teal/Cyan | Todos los usuarios |
| "Editar reseña (Admin)" | 🟠 Naranja | Solo admins |
| "Ya dejaste tu reseña" | ⚪ Gris | Info (no clickeable) |

## 🎉 Beneficios del Sistema

### Para el Negocio:
- ✅ **Integridad**: Las reviews no se pueden manipular
- ✅ **Confianza**: Los clientes saben que las reviews son permanentes
- ✅ **Calidad**: Solo admins moderan contenido inapropiado

### Para los Usuarios:
- ✅ **Simplicidad**: Una review por negocio, sin ediciones
- ✅ **Honestidad**: No se pueden cambiar opiniones después
- ✅ **Claridad**: Saben exactamente qué pueden hacer

### Para los Admins:
- ✅ **Control**: Pueden editar/eliminar reviews inapropiadas
- ✅ **Moderación**: Gestión completa de contenido
- ✅ **Identificación**: Botón naranja diferenciado

## 📈 Estadísticas Sugeridas

Puedes trackear:
```sql
-- Reviews sin editar (auténticas)
SELECT COUNT(*) FROM reviews WHERE updated_at = created_at;

-- Reviews editadas por admins
SELECT COUNT(*) FROM reviews WHERE updated_at > created_at;

-- Promedio de rating por negocio
SELECT business_id, AVG(rating) FROM reviews GROUP BY business_id;
```

---

**¿Todo configurado?** ✅ Tu sistema de reviews ahora es seguro y profesional. Solo los administradores tienen control editorial, manteniendo la integridad de las reseñas.









