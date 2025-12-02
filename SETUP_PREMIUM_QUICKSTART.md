# 🚀 Setup Rápido - Sistema Premium

Guía paso a paso para poner en funcionamiento el sistema de suscripciones premium.

---

## ✅ Checklist de Instalación

- [ ] 1. Ejecutar migraciones SQL
- [ ] 2. Crear bucket de Storage
- [ ] 3. Configurar variables de entorno
- [ ] 4. Configurar PayPal
- [ ] 5. Probar el sistema

---

## 📝 Paso 1: Ejecutar Migraciones SQL

1. Abre **Supabase Dashboard** → Tu Proyecto
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de: `scripts/create-premium-system.sql`
5. Ejecuta (Run)
6. Espera confirmación: "Success. No rows returned"

**Verifica que se crearon las tablas:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('premium_plans', 'business_subscriptions', 'payments', 'manual_payment_submissions');
```

Deberías ver 4 tablas.

---

## 📦 Paso 2: Crear Bucket de Storage

**Opción A: SQL (Recomendado)**

1. En SQL Editor, ejecuta: `scripts/create-storage-bucket.sql`

**Opción B: Manual**

1. Ve a **Storage** en Supabase
2. Clic en "Create bucket"
3. Nombre: `payment_receipts`
4. Public: ✅ Sí
5. Configurar políticas según el script

**Verificar:**

```sql
SELECT * FROM storage.buckets WHERE id = 'payment_receipts';
```

---

## 🔑 Paso 3: Variables de Entorno

1. Crea o abre tu archivo `.env.local`
2. Agrega estas variables:

```env
# PayPal Sandbox (para testing)
PAYPAL_CLIENT_ID=tu_client_id_sandbox
PAYPAL_CLIENT_SECRET=tu_client_secret_sandbox
PAYPAL_MODE=sandbox

# URL de tu app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **NO** hagas commit de este archivo

---

## 💳 Paso 4: Configurar PayPal Sandbox

### 4.1 Crear Cuenta Developer

1. Ve a [developer.paypal.com](https://developer.paypal.com/)
2. Inicia sesión o crea cuenta
3. Ve a **Dashboard**

### 4.2 Crear Aplicación Sandbox

1. Ve a **Apps & Credentials** → **Sandbox**
2. Clic en "Create App"
3. Nombre: "Encuentra Premium"
4. Tipo: Merchant
5. Clic en **Create App**

### 4.3 Obtener Credenciales

En la página de tu app verás:

- **Client ID** → Copia esto a `PAYPAL_CLIENT_ID`
- **Secret** (clic en "Show") → Copia a `PAYPAL_CLIENT_SECRET`

### 4.4 Configurar Return URLs (Opcional)

En la misma página de la app:

1. Scroll hasta "Return URL"
2. Agrega:
   - Success: `http://localhost:3000/app/dashboard/premium/success`
   - Cancel: `http://localhost:3000/app/dashboard/premium/cancel`

### 4.5 Cuentas de Prueba

PayPal Sandbox viene con cuentas pre-creadas:

1. Ve a **Sandbox** → **Accounts**
2. Verás dos cuentas:
   - **Personal** (Comprador) - Para hacer pagos de prueba
   - **Business** (Vendedor) - Donde recibes los pagos

**Para probar pagos:**
- Usa el email y contraseña de la cuenta **Personal**
- Los pagos aparecerán en la cuenta **Business**

---

## 🧪 Paso 5: Probar el Sistema

### 5.1 Iniciar la Aplicación

```bash
npm run dev
```

### 5.2 Crear un Negocio

1. Inicia sesión en tu app
2. Crea un negocio de prueba
3. Guarda el ID del negocio

### 5.3 Probar Pago con PayPal

1. Ve a: `http://localhost:3000/app/dashboard/negocios/[tu-negocio-id]/premium`
2. Selecciona un plan (ej: Premium Mensual)
3. Clic en "Pagar con PayPal"
4. Serás redirigido a PayPal Sandbox
5. Inicia sesión con la cuenta **Personal** de prueba
6. Completa el pago
7. Deberías volver a `/success`
8. Tu negocio ahora es premium

**Verificar en DB:**

```sql
SELECT is_premium, premium_until, premium_plan_id
FROM businesses
WHERE id = 'tu-negocio-id';
```

### 5.4 Probar Pago Manual

1. En la página premium, selecciona "Pago Manual"
2. Método: Zelle
3. Referencia: "TEST123"
4. Sube una imagen cualquiera
5. Clic en "Enviar para Verificación"
6. Deberías ver mensaje de éxito

**Ver en el panel admin:**

1. Ve a: `http://localhost:3000/app/dashboard/admin/payments`
2. Deberías ver el pago pendiente
3. Clic en "Aprobar"
4. El negocio ahora es premium

---

## 🎯 Verificaciones Finales

### ✅ Checklist de Funcionalidad

- [ ] Se pueden ver los planes en `/premium`
- [ ] PayPal redirige correctamente
- [ ] Los pagos de PayPal se capturan
- [ ] Los negocios se marcan como premium
- [ ] Las capturas de pago manual se suben
- [ ] El panel admin muestra pagos pendientes
- [ ] Aprobar pagos funciona
- [ ] Rechazar pagos funciona

### 🔍 Queries de Verificación

```sql
-- Ver planes activos
SELECT * FROM premium_plans WHERE is_active = true;

-- Ver suscripciones
SELECT * FROM business_subscriptions ORDER BY created_at DESC LIMIT 5;

-- Ver pagos
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Ver pagos manuales pendientes
SELECT * FROM manual_payment_submissions WHERE status = 'pending';

-- Ver negocios premium
SELECT id, name, is_premium, premium_until 
FROM businesses 
WHERE is_premium = true;
```

---

## 🐛 Problemas Comunes

### "PayPal credentials not configured"

- Verifica que `.env.local` tiene las variables
- Reinicia el servidor: `npm run dev`

### "Failed to create PayPal order"

- Verifica que las credenciales son de **Sandbox** (no Live)
- Verifica que `PAYPAL_MODE=sandbox`
- Revisa la consola del servidor para ver el error completo

### "Bucket does not exist"

- Ejecuta `create-storage-bucket.sql`
- O crea el bucket manualmente en Storage

### No Aparece el Badge Premium

- Verifica que `is_premium = true` en la base de datos
- Verifica que `premium_until > NOW()`
- Implementa el badge en tu componente de negocio

---

## 📈 Próximos Pasos

Después de que todo funcione:

1. **Integrar badges** en tus componentes de negocio existentes
2. **Modificar la sección "Destacados"** para priorizar premium
3. **Agregar enlaces** a `/premium` desde tus páginas de negocio
4. **Implementar verificación de admin** en los endpoints admin
5. **Configurar PayPal Live** para producción

---

## 📚 Documentación Completa

Para más detalles, consulta:

- `SISTEMA_PREMIUM_DOCUMENTACION.md` - Documentación técnica completa
- `VARIABLES_ENTORNO_PREMIUM.md` - Configuración de variables
- Los comentarios en los archivos de código

---

## ✨ ¡Listo!

Si llegaste hasta aquí y todo funciona, ¡felicidades! 🎉

Tu sistema de suscripciones premium está operativo.

**Siguiente:** Integra los badges premium en tus componentes existentes de negocio.


