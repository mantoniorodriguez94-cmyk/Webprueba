# Configuración de Limpieza Automática de Premium y Destacados

## 📋 Resumen

Este sistema limpia automáticamente los negocios premium y destacados cuando sus fechas de expiración (`premium_until` y `featured_until`) han pasado. Los días se "disminuyen" automáticamente al comparar la fecha actual con la fecha de expiración.

## ✅ Cómo Funciona

1. **Sistema de Fechas**: 
   - Cuando se activa premium/destacado, se guarda una fecha de expiración (`premium_until` / `featured_until`)
   - Cada día que pasa, el tiempo restante disminuye automáticamente (no necesitas un contador)
   - Ejemplo: Si activas premium el 1 de enero por 30 días, `premium_until = 31 de enero`
   - El 15 de enero, quedan 16 días automáticamente (31 - 15 = 16)

2. **Limpieza Automática**:
   - La función SQL `cleanup_expired_premium_and_featured()` compara `premium_until < NOW()` y `featured_until < NOW()`
   - Si la fecha ya pasó, actualiza `is_premium = false` o `is_featured = false`
   - Esto asegura que los datos estén consistentes en la base de datos

3. **Verificación en Tiempo Real**:
   - El código también verifica `premium_until > NOW()` en cada consulta
   - Incluso si no se ejecuta la limpieza automática, la UI mostrará correctamente el estado
   - Pero la limpieza automática mantiene la base de datos limpia

## 🚀 Pasos para Configurar

### Paso 1: Ejecutar Script SQL

Ejecuta el script en Supabase Dashboard > SQL Editor:

```sql
-- Archivo: scripts/cleanup-expired-premium-featured.sql
```

Esto crea las funciones:
- `cleanup_expired_premium_and_featured()` - Retorna conteos
- `cleanup_expired_premium_and_featured_simple()` - Solo actualiza sin retornar

### Paso 2: Configurar Ejecución Automática

Tienes 3 opciones:

#### Opción A: Cron Job en Supabase (Recomendado)

1. **Instalar extensión pg_cron** (si no está instalada):
   ```sql
   -- En Supabase Dashboard > Database > Extensions
   -- Buscar "pg_cron" e instalarla
   ```

2. **Configurar cron job diario**:
   ```sql
   SELECT cron.schedule(
     'cleanup-expired-premium-featured',
     '0 0 * * *',  -- Todos los días a medianoche UTC
     'SELECT cleanup_expired_premium_and_featured_simple();'
   );
   ```

3. **Verificar que está configurado**:
   ```sql
   SELECT * FROM cron.job;
   ```

#### Opción B: Vercel Cron (Si usas Vercel)

1. **Crear archivo `vercel.json`** en la raíz del proyecto:
   ```json
   {
     "crons": [{
       "path": "/api/admin/cleanup-expired",
       "schedule": "0 0 * * *"
     }]
   }
   ```

2. **Configurar variable de entorno** en Vercel:
   - `CRON_SECRET`: Un string secreto aleatorio (ej: `openssl rand -hex 32`)

3. **Actualizar la llamada** para incluir el secret:
   ```bash
   # La llamada incluirá el header automáticamente
   # O puedes configurar un webhook en Vercel
   ```

#### Opción C: GitHub Actions (Gratis)

1. **Crear archivo `.github/workflows/cleanup-expired.yml`**:
   ```yaml
   name: Cleanup Expired Premium and Featured
   
   on:
     schedule:
       - cron: '0 0 * * *'  # Diario a medianoche UTC
     workflow_dispatch:  # Permite ejecución manual
   
   jobs:
     cleanup:
       runs-on: ubuntu-latest
       steps:
         - name: Call cleanup API
           run: |
             curl -X POST https://tu-dominio.com/api/admin/cleanup-expired \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

2. **Configurar secret en GitHub**:
   - Settings > Secrets > Actions > New secret
   - Name: `CRON_SECRET`
   - Value: Un string secreto aleatorio

3. **Actualizar `vercel.json` o tu plataforma de hosting** para aceptar el header

### Paso 3: Probar Manualmente

Puedes probar la limpieza manualmente:

1. **Como admin, desde el navegador**:
   ```bash
   # Hacer POST a la ruta (necesitas estar autenticado como admin)
   curl -X POST http://localhost:3000/api/admin/cleanup-expired \
     -H "Cookie: tu-cookie-de-sesion"
   ```

2. **O ejecutar directamente en SQL**:
   ```sql
   SELECT * FROM cleanup_expired_premium_and_featured();
   ```

3. **O usar GET para verificar**:
   ```
   GET /api/admin/cleanup-expired
   ```

## 🔍 Verificación

Para verificar que funciona correctamente:

```sql
-- Ver negocios premium que están próximos a expirar (hoy o ya expirados)
SELECT 
  name,
  is_premium,
  premium_until,
  CASE 
    WHEN premium_until < NOW() THEN '⚠️ EXPIRADO'
    WHEN premium_until < NOW() + INTERVAL '7 days' THEN '⏰ Expira pronto'
    ELSE '✅ Activo'
  END as estado
FROM businesses
WHERE is_premium = true
ORDER BY premium_until ASC;

-- Ver negocios destacados próximos a expirar
SELECT 
  name,
  is_featured,
  featured_until,
  CASE 
    WHEN featured_until < NOW() THEN '⚠️ EXPIRADO'
    WHEN featured_until < NOW() + INTERVAL '7 days' THEN '⏰ Expira pronto'
    ELSE '✅ Activo'
  END as estado
FROM businesses
WHERE is_featured = true
ORDER BY featured_until ASC;
```

## 📝 Notas Importantes

1. **Frecuencia Recomendada**: Ejecutar diariamente es suficiente. Los usuarios verán el estado correcto en tiempo real gracias a las verificaciones `premium_until > NOW()`.

2. **Zona Horaria**: Los cron jobs usan UTC por defecto. Ajusta según tu zona horaria si es necesario.

3. **Sin Limpieza Automática**: Si no configuras el cron, el sistema seguirá funcionando porque verifica fechas en tiempo real, pero la base de datos puede tener `is_premium = true` en negocios que ya expiraron (solo a nivel de datos, no funcional).

4. **Seguridad**: Si usas la API route con cron externo, asegúrate de configurar `CRON_SECRET` para evitar llamadas no autorizadas.

## 🐛 Troubleshooting

**Error: "function cleanup_expired_premium_and_featured does not exist"**
- ✅ Ejecutar el script SQL primero
- ✅ Verificar que estás en la base de datos correcta

**Error: "extension pg_cron does not exist"**
- ✅ Instalar la extensión en Supabase Dashboard > Database > Extensions
- ✅ O usar una de las opciones alternativas (Vercel Cron, GitHub Actions)

**Los negocios expirados siguen apareciendo como premium/destacados**
- ✅ Verificar que el cron job se está ejecutando: `SELECT * FROM cron.job_run_details;`
- ✅ Ejecutar manualmente: `SELECT * FROM cleanup_expired_premium_and_featured();`
- ✅ Verificar que las fechas en la BD son correctas

**El cron no se ejecuta**
- ✅ Verificar zona horaria (cron usa UTC)
- ✅ Verificar sintaxis del cron: `0 0 * * *` = todos los días a medianoche
- ✅ Verificar logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

