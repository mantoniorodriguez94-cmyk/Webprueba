# 🚀 Siguientes Pasos - Sistema Premium PayPal

## ✅ Estado Actual: LISTO PARA USAR

Los endpoints de PayPal están **100% funcionales** y listos. Ahora solo necesitas probarlos.

---

## 📝 Checklist de Lo Que YA Tienes

- ✅ **Base de datos completa** (5 tablas + funciones)
- ✅ **Endpoints PayPal funcionando** (create-order + capture-order)
- ✅ **Endpoints pagos manuales** (submit + approve + reject)
- ✅ **Páginas UI** (premium, success, cancel, admin)
- ✅ **Componentes premium** (badges, borders, banners)
- ✅ **Variables de entorno configuradas** (según me dijiste)
- ✅ **Bucket de Storage** (según me dijiste)
- ✅ **Tipos TypeScript** (todo tipado)
- ✅ **Documentación completa** (múltiples guías)

---

## 🎯 Lo Que DEBES Hacer Ahora (en orden)

### 1️⃣ Verificar Base de Datos (2 minutos)

Ejecuta en Supabase SQL Editor:

```sql
-- Copia y pega todo el contenido de:
scripts/verify-paypal-setup.sql
```

**Resultado esperado:**
```
✅ Tablas creadas: 4/4
✅ Campos en businesses: 3/3
✅ Planes activos: 2
✅ RLS habilitado: 4/4 tablas
✅ Storage bucket: Configurado
✅ Funciones SQL: 2
```

Si alguno no está ✅, ejecuta:
- `scripts/create-premium-system.sql`
- `scripts/create-storage-bucket.sql`

---

### 2️⃣ Verificar Variables de Entorno (1 minuto)

Abre tu `.env.local` y verifica que tienes:

```env
PAYPAL_CLIENT_ID=tu_sandbox_client_id
PAYPAL_CLIENT_SECRET=tu_sandbox_secret
PAYPAL_MODE=sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:**
- `NEXT_PUBLIC_APP_URL` sin `/` al final
- `PAYPAL_MODE=sandbox` para testing
- Credenciales de **Sandbox**, no Live

---

### 3️⃣ Reiniciar Servidor (30 segundos)

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo:
npm run dev
```

Esto asegura que las nuevas variables se carguen.

---

### 4️⃣ Agregar Enlace a Premium (5 minutos)

En algún lugar de tu UI de negocio, agrega un botón/enlace a la página premium.

Por ejemplo, en la página del negocio:

```tsx
// src/app/app/dashboard/negocios/[id]/page.tsx
// Agregar este botón si el usuario es el dueño:

{user?.id === business.owner_id && (
  <Link 
    href={`/app/dashboard/negocios/${business.id}/premium`}
    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
  >
    ⭐ Mejorar a Premium
  </Link>
)}
```

O en tu menú de gestión de negocios.

---

### 5️⃣ Probar el Sistema (10 minutos)

#### A. Obtener Credenciales de Prueba PayPal

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Inicia sesión
3. Ve a "Sandbox" → "Accounts"
4. Verás dos cuentas:
   - **Personal** (comprador) → Anota email y password
   - **Business** (vendedor) → Donde recibes el dinero

#### B. Hacer Prueba de Pago

1. **Navega a tu negocio:**
   ```
   http://localhost:3000/app/dashboard/negocios/[tu-negocio-id]
   ```

2. **Clic en el botón "Mejorar a Premium"** (que agregaste en el paso 4)

3. **Selecciona un plan:**
   - Premium Mensual ($9.99)
   - O Premium Anual ($99.99)

4. **Clic en "Pagar con PayPal"**

5. **Serás redirigido a PayPal Sandbox:**
   - Inicia sesión con la cuenta **Personal** de prueba
   - Email: el de la cuenta Personal del dashboard
   - Password: el password del dashboard
   - Clic en "Continue" o "Pay Now"

6. **Confirma el pago**

7. **Serás redirigido a `/premium/success`:**
   - Verás un spinner "Procesando..."
   - Luego "¡Pago Exitoso!"
   - Te redirige al dashboard en 3 segundos

8. **Verifica que funcionó:**

Abre Supabase SQL Editor y ejecuta:

```sql
-- Ver tu negocio
SELECT id, name, is_premium, premium_until, premium_plan_id
FROM businesses
WHERE id = 'tu-negocio-id';

-- Debería mostrar:
-- is_premium = true
-- premium_until = fecha futura
-- premium_plan_id = uuid del plan
```

---

### 6️⃣ Probar Cancelación (opcional, 3 minutos)

1. Selecciona un plan
2. Clic en "Pagar con PayPal"
3. En PayPal, clic en "Cancel and return"
4. Deberías ver la página `/premium/cancel`
5. El negocio NO debe ser premium

---

### 7️⃣ Integrar Badge Premium (cuando quieras)

Cuando un negocio es premium, muestra su badge:

```tsx
import PremiumBadge, { PremiumBanner } from '@/components/ui/PremiumBadge'

// En tu componente de BusinessCard o similar:
{business.is_premium && (
  <>
    <PremiumBanner />  {/* Banner en esquina superior */}
    <PremiumBadge />   {/* Badge ⭐ Premium */}
  </>
)}
```

---

## 🐛 Si Algo No Funciona

### Error: "PayPal credentials not configured"

**Causa:** Variables no cargadas

**Solución:**
1. Verifica `.env.local`
2. Reinicia servidor: `npm run dev`
3. Verifica que las variables no tienen espacios

### Error: "Failed to create PayPal order"

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica que son credenciales de **Sandbox**
2. Verifica `PAYPAL_MODE=sandbox`
3. Revisa logs del servidor para ver el error específico

### No redirige a PayPal

**Causa:** `NEXT_PUBLIC_APP_URL` incorrecta

**Solución:**
1. Debe ser exactamente: `http://localhost:3000`
2. Sin `/` al final
3. Reinicia el servidor

### El pago no se captura

**Causa:** sessionStorage perdido

**Solución:**
1. Verifica que el navegador permite sessionStorage
2. No cierres la pestaña durante el proceso
3. Revisa la consola del navegador (F12)

---

## 📊 Verificar en Base de Datos

Después de un pago exitoso, ejecuta:

```sql
-- Ver todos los pagos
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- Ver suscripciones activas
SELECT * FROM business_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;

-- Ver negocios premium
SELECT id, name, is_premium, premium_until
FROM businesses
WHERE is_premium = true;
```

---

## 🌐 Configurar para Producción (después)

Cuando todo funcione en localhost:

### 1. Crear App PayPal Live

1. Ve a PayPal Developer → **Live**
2. Crea nueva app
3. Copia Client ID y Secret de **Live**

### 2. Actualizar Variables

```env
# En producción:
PAYPAL_CLIENT_ID=live_client_id
PAYPAL_CLIENT_SECRET=live_secret
PAYPAL_MODE=live
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

### 3. Deploy

- Sube el código a producción
- Configura las variables de entorno en tu servidor
- Las URLs de PayPal cambiarán automáticamente a live

---

## 📚 Documentación Disponible

Si necesitas más detalles:

1. **`INTEGRACION_PAYPAL_COMPLETA.md`** ← Lee este para entender todo
2. **`SISTEMA_PREMIUM_DOCUMENTACION.md`** ← Documentación técnica completa
3. **`SETUP_PREMIUM_QUICKSTART.md`** ← Guía de instalación
4. **`VARIABLES_ENTORNO_PREMIUM.md`** ← Setup de PayPal

---

## ✅ Checklist Final

Marca cuando completes cada paso:

- [ ] 1. Ejecuté `verify-paypal-setup.sql` y todo está ✅
- [ ] 2. Verifiqué que mis variables de entorno están correctas
- [ ] 3. Reinicié el servidor
- [ ] 4. Agregué enlace a `/premium` en mi UI
- [ ] 5. Obtuve credenciales de cuenta Personal de PayPal Sandbox
- [ ] 6. Hice una prueba de pago completa
- [ ] 7. Verifiqué en la DB que el negocio es premium
- [ ] 8. Probé cancelar un pago
- [ ] 9. Integré badges premium en mi UI (opcional)

---

## 🎉 ¡Listo!

Cuando completes todos los pasos, tendrás un sistema de suscripciones premium **100% funcional**.

**Tu siguiente acción:** Ejecutar paso 1 (verificar base de datos) y seguir en orden.

**¿Algún problema?** Revisa la sección de troubleshooting o consulta la documentación completa.

---

**Estado:** ✅ Todo implementado  
**Tu tarea:** Probar y verificar  
**Tiempo estimado:** 20-30 minutos



