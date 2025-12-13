# 🕐 Guía Paso a Paso: Configurar Cron Job para Limpieza Automática

Esta guía te mostrará exactamente cómo configurar el cron job para que se ejecute automáticamente cada día y limpie los negocios premium/destacados expirados.

---

## 📋 Prerequisitos

1. ✅ Script SQL ejecutado: `scripts/cleanup-expired-premium-featured.sql`
2. ✅ API route creada: `/api/admin/cleanup-expired`
3. ✅ Acceso a Supabase Dashboard

---

## 🎯 Opción 1: Supabase pg_cron (RECOMENDADO - Más Simple)

Esta es la opción más fácil porque se ejecuta directamente en tu base de datos, sin depender de servicios externos.

### Paso 1: Instalar Extensión pg_cron en Supabase

1. Ve a tu **Supabase Dashboard**
2. Selecciona tu proyecto
3. Ve a **Database** → **Extensions** (en el menú lateral)
4. Busca **"pg_cron"** en la lista
5. Haz clic en el toggle para **activarlo** (debe cambiar a verde/activado)
6. Espera unos segundos a que se instale

### Paso 2: Verificar que pg_cron está instalado

Ve a **SQL Editor** y ejecuta:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Si ves una fila con `extname = 'pg_cron'`, está instalado correctamente.

### Paso 3: Configurar el Cron Job

En **SQL Editor**, ejecuta este SQL:

```sql
-- Programar limpieza diaria a las 00:00 UTC (medianoche)
SELECT cron.schedule(
  'cleanup-expired-premium-featured',  -- Nombre único del job
  '0 0 * * *',  -- Todos los días a medianoche UTC
  $$SELECT cleanup_expired_premium_and_featured_simple();$$
);
```

**Explicación del horario:**
- `0 0 * * *` = Todos los días a las 00:00 UTC
- Formato: `minuto hora día mes día-semana`
- Si quieres otra hora, por ejemplo las 2:00 AM UTC: `0 2 * * *`

### Paso 4: Verificar que el Cron Job está configurado

Ejecuta este SQL:

```sql
SELECT * FROM cron.job;
```

Deberías ver una fila con:
- `jobname = 'cleanup-expired-premium-featured'`
- `schedule = '0 0 * * *'`

### Paso 5: Probar Manualmente (Opcional)

Puedes probar ejecutar el job manualmente:

```sql
-- Ver todos los jobs
SELECT * FROM cron.job;

-- Ejecutar el job manualmente
SELECT cron.schedule_run('cleanup-expired-premium-featured');

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### ✅ Listo!

El cron job se ejecutará automáticamente cada día a medianoche UTC. Puedes verificar el historial de ejecuciones en cualquier momento con:

```sql
SELECT 
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-premium-featured'
)
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🎯 Opción 2: Vercel Cron (Si usas Vercel para desplegar)

Si desplegas tu aplicación en Vercel, puedes usar su sistema de cron nativo.

### Paso 1: Crear archivo `vercel.json`

En la **raíz de tu proyecto**, crea o edita el archivo `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/admin/cleanup-expired",
    "schedule": "0 0 * * *"
  }]
}
```

**Nota:** El horario está en formato cron estándar (UTC).

### Paso 2: Configurar Variable de Entorno

1. Ve a tu proyecto en **Vercel Dashboard**
2. Ve a **Settings** → **Environment Variables**
3. Agrega una nueva variable:
   - **Key:** `CRON_SECRET`
   - **Value:** Genera un string aleatorio seguro (ej: `openssl rand -hex 32` o usa un generador online)
   - **Environment:** Production (y Development si quieres)

### Paso 3: Actualizar la API Route (Opcional - Ya está hecho)

La API route ya está preparada para aceptar el header `Authorization: Bearer ${CRON_SECRET}`. Vercel lo manejará automáticamente.

### Paso 4: Desplegar

```bash
git add vercel.json
git commit -m "Add cron job configuration"
git push
```

Vercel detectará automáticamente el `vercel.json` y configurará el cron.

### Paso 5: Verificar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **Cron Jobs**
3. Deberías ver tu cron job listado

### ✅ Listo!

El cron se ejecutará automáticamente. Puedes ver los logs en **Deployments** → Selecciona un deployment → **Functions** → Busca la función del cron.

---

## 🎯 Opción 3: GitHub Actions (Gratis, funciona siempre)

Esta opción es gratuita y funciona independientemente de dónde despliegues tu app.

### Paso 1: Crear Directorio de Workflows

En la raíz de tu proyecto, crea la estructura de directorios:

```bash
mkdir -p .github/workflows
```

### Paso 2: Crear Archivo de Workflow

Crea el archivo `.github/workflows/cleanup-expired.yml`:

```yaml
name: Cleanup Expired Premium and Featured

on:
  schedule:
    # Ejecutar todos los días a medianoche UTC
    - cron: '0 0 * * *'
  workflow_dispatch:  # Permite ejecución manual desde GitHub

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup API
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/cleanup-expired \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
        
      - name: Verify Success
        run: |
          echo "✅ Cleanup job executed"
```

### Paso 3: Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega estos secrets:

   **Secret 1:**
   - **Name:** `APP_URL`
   - **Value:** La URL de tu aplicación en producción (ej: `https://tu-app.vercel.app`)

   **Secret 2:**
   - **Name:** `CRON_SECRET`
   - **Value:** Un string aleatorio seguro (ej: genera uno con `openssl rand -hex 32`)

### Paso 4: Hacer Commit y Push

```bash
git add .github/workflows/cleanup-expired.yml
git commit -m "Add GitHub Actions cron for cleanup expired"
git push
```

### Paso 5: Verificar

1. Ve a tu repositorio en GitHub
2. Ve a la pestaña **Actions**
3. Deberías ver el workflow "Cleanup Expired Premium and Featured"
4. Puedes ejecutarlo manualmente con el botón **Run workflow**

### ✅ Listo!

El workflow se ejecutará automáticamente cada día. Puedes ver el historial en la pestaña **Actions**.

---

## 🔍 Verificación y Monitoreo

### Verificar que está funcionando (Supabase pg_cron)

```sql
-- Ver última ejecución
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-premium-featured'
)
ORDER BY start_time DESC 
LIMIT 1;
```

### Verificar que está funcionando (Vercel/GitHub Actions)

Revisa los logs de ejecución en:
- **Vercel:** Deployments → Functions → Logs
- **GitHub Actions:** Pestaña Actions → Selecciona el workflow → Ver logs

### Probar manualmente la limpieza

Puedes probar manualmente en cualquier momento ejecutando en SQL:

```sql
-- Ver cuántos negocios expirarían
SELECT 
  COUNT(*) FILTER (WHERE is_premium = true AND premium_until < NOW()) as premium_expired,
  COUNT(*) FILTER (WHERE is_featured = true AND featured_until < NOW()) as featured_expired
FROM businesses;

-- Ejecutar limpieza manualmente
SELECT * FROM cleanup_expired_premium_and_featured();
```

---

## ❌ Eliminar o Modificar el Cron Job

### Si usas Supabase pg_cron:

```sql
-- Eliminar el cron job
SELECT cron.unschedule('cleanup-expired-premium-featured');

-- Modificar el horario (eliminar y crear de nuevo)
SELECT cron.unschedule('cleanup-expired-premium-featured');
SELECT cron.schedule(
  'cleanup-expired-premium-featured',
  '0 2 * * *',  -- Nueva hora: 2:00 AM UTC
  $$SELECT cleanup_expired_premium_and_featured_simple();$$
);
```

### Si usas Vercel:

Edita `vercel.json` y cambia el `schedule`. Haz push para actualizar.

### Si usas GitHub Actions:

Edita `.github/workflows/cleanup-expired.yml` y cambia el `cron`. Haz commit y push.

---

## 🎯 Recomendación Final

**Para la mayoría de casos, usa la Opción 1 (Supabase pg_cron)** porque:
- ✅ Es la más simple de configurar
- ✅ No depende de servicios externos
- ✅ Es gratis (viene incluido en Supabase)
- ✅ Se ejecuta directamente en tu base de datos
- ✅ Más rápido (no necesita hacer HTTP requests)

**Usa las otras opciones solo si:**
- No tienes acceso a pg_cron en Supabase (plan gratuito limitado)
- Prefieres centralizar todo en Vercel
- Quieres más control sobre los logs y monitoreo

---

## 🆘 Troubleshooting

**Error: "extension pg_cron does not exist"**
- Ve a Database → Extensions y asegúrate de que pg_cron esté instalado
- Si no aparece, es posible que tu plan de Supabase no lo incluya

**El cron no se ejecuta**
- Verifica el horario (recuerda que está en UTC)
- Revisa los logs para ver errores
- Ejecuta manualmente para probar

**Los negocios expirados siguen apareciendo**
- Verifica que la función SQL se ejecutó correctamente
- Revisa los logs de ejecución
- Ejecuta manualmente: `SELECT * FROM cleanup_expired_premium_and_featured();`

---

¿Necesitas ayuda con alguna opción específica? ¡Avísame!

