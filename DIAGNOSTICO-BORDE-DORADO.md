# 🔍 Diagnóstico: Botón de Borde Dorado No Aparece en Todos los Negocios

## 🚨 Problema Reportado

Usuario tiene:
- ✅ Membresía Premium activa
- ✅ 2 negocios
- ⚠️ El botón de borde dorado aparece solo en 1 negocio
- ❌ En el otro negocio no aparece nada

---

## 🔎 Diagnóstico

### Paso 1: Verificar Estado de los Negocios

Ejecuta este script en Supabase SQL Editor:

```sql
-- REEMPLAZA 'TU-USER-ID-AQUI' con el ID real del usuario
SELECT 
  b.id,
  b.name,
  b.is_premium,
  b.premium_until,
  CASE 
    WHEN b.premium_until > NOW() THEN '✅ Activa'
    WHEN b.premium_until IS NULL THEN '❌ Sin membresía'
    ELSE '⚠️ Expirada'
  END as estado
FROM businesses b
WHERE b.owner_id = 'TU-USER-ID-AQUI'
ORDER BY b.created_at;
```

**Resultado esperado:**
```
ID       | Nombre         | is_premium | premium_until       | estado
---------|----------------|------------|---------------------|--------
abc-123  | Negocio A      | true       | 2025-01-24 10:00:00 | ✅ Activa
def-456  | Negocio B      | true       | 2025-01-24 10:00:00 | ✅ Activa
```

Si uno de los negocios tiene:
- `is_premium = false`
- `premium_until = null`
- `premium_until < NOW()`

**Entonces ese negocio NO es premium** y por eso no muestra el botón.

---

## 🎯 Posibles Causas

### Causa 1: Solo un negocio tiene membresía premium
**Situación:** El usuario pagó premium solo para un negocio específico, no para ambos.

**Solución:** El usuario debe:
1. Comprar una segunda membresía premium para el otro negocio, O
2. Si el sistema debe ser "membresía por usuario" (todos los negocios premium), necesitamos cambiar la lógica

### Causa 2: Error al activar premium en todos los negocios
**Situación:** El pago se procesó pero solo actualizó un negocio.

**Solución:** Ejecutar script de corrección (ver abajo)

### Causa 3: Campo `golden_border_active` no existe aún
**Situación:** No se ha ejecutado el script SQL de control de borde dorado.

**Solución:** Ejecutar `scripts/add-golden-border-control.sql`

---

## 🛠️ Soluciones

### Solución 1: Script de Corrección (Si ambos negocios deberían ser premium)

```sql
-- Ejecutar SOLO si ambos negocios del usuario deberían ser premium
-- REEMPLAZA los valores

UPDATE businesses
SET 
  is_premium = true,
  premium_until = '2025-02-24 23:59:59'  -- Ajusta la fecha según corresponda
WHERE owner_id = 'TU-USER-ID-AQUI'
AND id IN ('NEGOCIO-A-ID', 'NEGOCIO-B-ID');
```

### Solución 2: Verificar que el campo `golden_border_active` existe

```sql
-- Verificar si el campo existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name = 'golden_border_active';
```

Si NO devuelve resultados, ejecuta:
```bash
scripts/add-golden-border-control.sql
```

---

## 📋 Checklist de Verificación

Para cada negocio, verifica:

- [ ] `businesses.is_premium = true`
- [ ] `businesses.premium_until > NOW()`
- [ ] `businesses.golden_border_active` (columna existe)
- [ ] Existe registro en `business_subscriptions` con `status = 'active'`
- [ ] `business_subscriptions.end_date > NOW()`

---

## 🔄 Comportamiento Actual del Sistema

### Membresía por Negocio (Sistema Actual)
- Cada negocio tiene su propia membresía premium
- Un usuario puede tener 2 negocios: uno premium y otro no
- El botón de borde dorado solo aparece en negocios premium

### Lógica del Borde Dorado
- **Límite por usuario** (no por negocio)
- Usuario con membresía mensual: 1 borde dorado en total
- Usuario con membresía anual: 2 bordes dorados en total
- El límite se calcula basado en la suscripción más reciente del usuario

---

## 🎯 Decisión de Diseño Necesaria

**Pregunta:** ¿Cómo debería funcionar la membresía premium?

### Opción A: Membresía por Negocio (Actual)
- ✅ Cada negocio se paga individualmente
- ✅ Más flexible para usuarios con múltiples negocios
- ⚠️ El botón solo aparece en negocios que pagaron

### Opción B: Membresía por Usuario
- ✅ Un pago activa premium en TODOS los negocios del usuario
- ✅ Más simple para el usuario
- ⚠️ Requiere cambios en la lógica de pagos

---

## 🚀 Pasos Inmediatos

1. **Ejecuta el diagnóstico:**
   ```sql
   SELECT id, name, is_premium, premium_until
   FROM businesses
   WHERE owner_id = 'TU-USER-ID-AQUI';
   ```

2. **Verifica el resultado:**
   - Si ambos negocios tienen `is_premium = true` → el bug es otra cosa
   - Si solo uno tiene `is_premium = true` → ese es el comportamiento esperado

3. **Decide:**
   - ¿Ambos negocios deberían ser premium? → Ejecuta solución 1
   - ¿Solo el que pagó debe ser premium? → El sistema funciona correctamente

4. **Ejecuta el script de borde dorado:**
   ```bash
   scripts/add-golden-border-control.sql
   ```

---

## 📞 Información Necesaria

Para ayudarte mejor, necesito saber:

1. ¿Cuál es el `owner_id` del usuario con el problema?
2. ¿Ambos negocios deberían ser premium o solo uno?
3. ¿Cuál es el modelo de negocio deseado?
   - Membresía por negocio (pago individual)
   - Membresía por usuario (todos los negocios incluidos)

---

**Archivo de diagnóstico:** `scripts/diagnostico-negocios-premium.sql`

