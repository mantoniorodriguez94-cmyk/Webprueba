# 🔧 Instrucciones: Corregir Campo `created_at`

## 📋 RESUMEN

Necesitas ejecutar un script SQL en Supabase para asegurar que la columna `created_at` de la tabla `businesses` tenga el tipo de dato correcto y funcione automáticamente.

---

## 🚀 PROCESO PASO A PASO

### OPCIÓN RECOMENDADA: Script Automático

#### Paso 1: Ir a Supabase

1. Abre **Supabase Dashboard**
2. Ve a tu proyecto "Encuentra"
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **+ New Query**

#### Paso 2: Ejecutar Script Automático

1. Abre el archivo: `scripts/FIX-CREATED-AT-AUTOMATICO.sql`
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el editor SQL de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

#### Paso 3: Verificar Resultados

Deberías ver mensajes en la salida como:

```
✅ PASO 1: Definición de view guardada (o "No se encontró la view")
✅ PASO 2: View eliminada
✅ PASO 3.1: Tipo cambiado a timestamptz
✅ PASO 3.2: DEFAULT establecido
✅ PASO 3.3: NOT NULL establecido
✅ PASO 4: View recreada
✅ VERIFICACIÓN FINAL
```

Al final verás una tabla con tus últimos 10 negocios mostrando:
- Nombre
- Fecha de creación
- Días desde la creación
- Estado (RECIENTE o Antiguo)

---

## 🔍 OPCIÓN ALTERNATIVA: Paso por Paso Manual

Si prefieres ver primero qué tienes antes de hacer cambios:

### Paso A: Verificar Estado Actual

Ejecuta: `scripts/step1-check-view-definition.sql`

Esto te mostrará:
- Si tienes la view `business_analytics_summary`
- Su definición exacta (guárdala por si la necesitas)
- El tipo actual de `created_at`

### Paso B: Ejecutar Corrección

Ejecuta: `scripts/step2-fix-created-at-final.sql`

Y si tenías una view:
- Copia su definición del Paso A
- Pégala en la sección PASO 4 del script
- Ejecuta todo

---

## ✅ RESULTADO ESPERADO

Después de ejecutar el script, deberías tener:

```
✓ column_name: created_at
✓ data_type: timestamp with time zone
✓ is_nullable: NO
✓ column_default: timezone('utc'::text, now())
```

---

## 🎯 VERIFICACIÓN FINAL EN LA APP

1. **Abre** tu app → Dashboard
2. **Abre** la consola del navegador (F12)
3. **Crea** un nuevo negocio
4. **Espera** a que te redirija
5. **Haz clic** en el tab "Recientes"
6. **Observa** los logs en consola:

```
🔍 Negocio: [Tu Negocio] | created_at: 2024-... | días: 0.00 | es reciente: true
📊 Total negocios: X
📅 Negocios recientes (últimos 7 días): Y
```

7. **Verifica** que tu negocio aparece en la lista

---

## ⚠️ IMPORTANTE

- ✅ **EJECUTA** el script en Supabase (backend)
- ✅ **NO toques** el código frontend (ya está correcto)
- ✅ **NO agregues** campos al formulario
- ✅ **El campo es automático** - no requiere intervención del usuario

---

## 📁 ARCHIVOS CREADOS

1. **`scripts/FIX-CREATED-AT-AUTOMATICO.sql`**
   - ⭐ **RECOMENDADO** - Hace todo automáticamente
   - Usa este si quieres una solución rápida

2. **`scripts/step1-check-view-definition.sql`**
   - Para verificar el estado actual primero
   - Usa este si quieres ver qué tienes antes

3. **`scripts/step2-fix-created-at-final.sql`**
   - Para ejecutar la corrección manual
   - Usa este si ejecutaste el paso 1 primero

4. **`scripts/verify-created-at-field.sql`**
   - Script de verificación adicional
   - Para debugging

5. **`scripts/check-businesses-dates.sql`**
   - Query para ver fechas de negocios
   - Útil para verificar

6. **`CAMPO_CREATED_AT_VERIFICACION.md`**
   - Documentación completa del sistema

---

## 🆘 SI ALGO SALE MAL

Si después de ejecutar el script:

### Error: "view does not exist"
✅ **Está bien** - significa que no tenías esa view

### Error: "column already exists"
✅ **Está bien** - significa que ya estaba configurada

### Error: "permission denied"
❌ **Problema** - verifica que tienes permisos de admin en Supabase

### Los negocios no aparecen en "Recientes"
1. Abre la consola (F12)
2. Ve a la pestaña "Console"
3. Busca los logs que empiezan con 🔍
4. Copia y pega esos logs para que pueda ayudarte

---

## ✨ SIGUIENTE PASO

**AHORA:** Ejecuta `scripts/FIX-CREATED-AT-AUTOMATICO.sql` en Supabase y luego prueba crear un negocio.


