# Variables de Entorno - Sistema Premium

## Variables Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# PayPal API Credentials
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# PayPal Mode: 'sandbox' para pruebas, 'live' para producción
PAYPAL_MODE=sandbox

# URL base de tu aplicación (para redirects de PayPal)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuración de PayPal

### 1. PayPal Sandbox (Pruebas)

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Crea una nueva aplicación en "Apps & Credentials" → Sandbox
3. Copia el **Client ID** y **Client Secret**
4. Configura las URLs de retorno:
   - Success URL: `http://localhost:3000/app/dashboard/premium/success`
   - Cancel URL: `http://localhost:3000/app/dashboard/premium/cancel`

### 2. Cuentas de Prueba

PayPal Sandbox incluye cuentas de prueba:
- **Personal Account**: Para simular un comprador
- **Business Account**: Para recibir los pagos

Puedes crear más cuentas en: Sandbox → Accounts

### 3. PayPal Live (Producción)

1. Verifica tu cuenta de negocio PayPal
2. Crea una aplicación en "Apps & Credentials" → Live
3. Actualiza las variables:
   ```env
   PAYPAL_MODE=live
   NEXT_PUBLIC_APP_URL=https://tudominio.com
   ```
4. Configura las URLs de producción:
   - Success URL: `https://tudominio.com/app/dashboard/premium/success`
   - Cancel URL: `https://tudominio.com/app/dashboard/premium/cancel`

## Seguridad

⚠️ **IMPORTANTE:**
- `PAYPAL_CLIENT_SECRET` es sensible y solo se usa en el servidor
- Nunca expongas estas credenciales en el frontend
- Asegúrate de que `.env.local` esté en `.gitignore`
- Usa variables diferentes para desarrollo y producción

## Testing

Para probar en Sandbox:

1. Inicia sesión en una cuenta Personal de Sandbox
2. Realiza un pago de prueba
3. Los fondos no son reales
4. Puedes aprobar/rechazar pagos desde el dashboard de Sandbox



