# Verificación del Campo `created_at` en Businesses

## ✅ ESTADO ACTUAL

### 1. Schema de la Tabla (CORRECTO)
La tabla `businesses` YA TIENE la columna `created_at` correctamente configurada:

```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
```

**Ubicación:** `scripts/create-businesses-table.sql` línea 20

### 2. Código de Creación de Negocios (CORRECTO)
El formulario de creación NO envía manualmente `created_at`:

**Archivo:** `src/app/app/dashboard/negocios/nuevo/page.tsx` líneas 148-162

```typescript
const { error: insertError } = await supabase
  .from('businesses')
  .insert({
    owner_id: user.id,
    name,
    description: description || null,
    category: category || null,
    address: address || null,
    phone: phone ? Number(phone) : null,
    whatsapp: whatsapp ? Number(whatsapp) : null,
    logo_url: logoUrl,
    gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null
    // ✅ NO se envía created_at - se genera automáticamente
  })
```

### 3. Campo NO Visible para el Usuario (CORRECTO)
- ✅ No hay input en el formulario
- ✅ No es editable por el usuario
- ✅ Se genera automáticamente en la base de datos

---

## 🔧 CÓMO VERIFICAR QUE FUNCIONA EN TU BASE DE DATOS

### Paso 1: Ejecutar Script de Verificación

Ve a **Supabase Dashboard → SQL Editor** y ejecuta el script:

```
scripts/verify-created-at-field.sql
```

Este script:
1. ✅ Verifica que la columna existe
2. ✅ Asegura que tiene el DEFAULT correcto
3. ✅ Configura como NOT NULL
4. ✅ Actualiza negocios sin fecha (si los hay)
5. ✅ Crea índice para mejorar performance
6. ✅ Muestra los 5 negocios más recientes con sus fechas

### Paso 2: Verificar Resultado Esperado

Después de ejecutar el script, deberías ver:

```
column_name  | data_type                    | is_nullable | column_default
created_at   | timestamp with time zone     | NO          | timezone('utc'::text, now())
```

---

## 📝 CÓMO FUNCIONA

### Al Crear un Negocio:

1. **Frontend** envía datos del negocio (nombre, descripción, etc.)
2. **Supabase** recibe el INSERT sin `created_at`
3. **PostgreSQL** detecta que falta `created_at`
4. **PostgreSQL** aplica el DEFAULT automáticamente
5. **Resultado:** El negocio tiene `created_at` con la fecha exacta de creación

### Ejemplo de Registro en la Base de Datos:

```sql
{
  "id": "uuid-123",
  "name": "Mi Negocio",
  "created_at": "2024-01-15T14:30:00.000Z",  -- ⬅️ Generado automáticamente
  ...
}
```

---

## 🎯 USO DEL CAMPO `created_at`

### Filtrar Negocios Recientes (Últimos 7 días)

**Frontend** (`src/app/app/dashboard/page.tsx`):

```typescript
const recentBusinesses = allBusinesses.filter((business) => {
  if (!business.created_at) return false
  const created = new Date(business.created_at)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays < 7
})
```

**Backend** (SQL):

```sql
SELECT * FROM businesses
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: Negocios sin `created_at`

**Síntoma:** Algunos negocios no aparecen en "Recientes"

**Solución:** El script `verify-created-at-field.sql` actualiza automáticamente los registros sin fecha.

### Problema 2: Fechas en el Futuro

**Síntoma:** `diffDays` es negativo

**Solución:** El filtro incluye `diffDays >= 0` para ignorar fechas futuras (posibles errores de zona horaria).

### Problema 3: Todos los Negocios Aparecen como Recientes

**Síntoma:** El campo siempre es NULL o tiene un valor incorrecto

**Causa:** El DEFAULT no está configurado correctamente

**Solución:** Ejecutar `verify-created-at-field.sql`

---

## 🔍 DEBUG: Ver Fechas de Negocios

Si necesitas ver las fechas de todos tus negocios:

```sql
SELECT 
    name,
    created_at,
    EXTRACT(DAY FROM (NOW() - created_at)) as dias_desde_creacion,
    CASE 
        WHEN created_at >= NOW() - INTERVAL '7 days' THEN 'RECIENTE ✓'
        ELSE 'ANTIGUO'
    END as estado
FROM businesses
ORDER BY created_at DESC;
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Tabla `businesses` tiene columna `created_at`
- [x] Columna tiene DEFAULT automático
- [x] Columna es NOT NULL
- [x] Frontend NO envía `created_at` manualmente
- [x] Campo NO es visible ni editable para el usuario
- [x] Índice creado para mejorar performance
- [ ] **EJECUTAR:** `scripts/verify-created-at-field.sql` en Supabase
- [ ] **PROBAR:** Crear un negocio y verificar que aparece en "Recientes"

---

## 📚 REFERENCIAS

- **Schema:** `scripts/create-businesses-table.sql`
- **Verificación:** `scripts/verify-created-at-field.sql`
- **Frontend:** `src/app/app/dashboard/negocios/nuevo/page.tsx`
- **Filtro:** `src/app/app/dashboard/page.tsx` (línea ~460)



