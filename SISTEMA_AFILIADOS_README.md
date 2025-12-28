# 🎯 Sistema de Afiliados/Referidos

Sistema completo de referidos que permite a "Socios" atraer tráfico y ganar comisiones recurrentes del 50% sobre los pagos de usuarios referidos.

---

## 📋 Características Implementadas

### 1. **Captura de Link de Referido**
- ✅ Detección automática del parámetro `?ref=partner_id` en cualquier URL
- ✅ Validación de UUID para asegurar formato correcto
- ✅ Persistencia en cookie (30 días)
- ✅ Limpieza automática de la URL (elimina `?ref` después de guardar)

### 2. **Registro con Atribución**
- ✅ El sistema lee la cookie al registrarse
- ✅ Guarda el `referred_by` en el perfil del usuario
- ✅ Limpia la cookie después de usarla

### 3. **Comisiones Automáticas (50%)**
- ✅ Trigger de PostgreSQL que escucha pagos completados
- ✅ Cálculo automático: 50% del monto del pago
- ✅ Creación automática de registro en `commissions`
- ✅ Funciona para todos los tipos de pago (PayPal, manual, etc.)

---

## 🗄️ Estructura de Base de Datos

### Tabla `profiles`
```sql
ALTER TABLE public.profiles
ADD COLUMN referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
```

### Tabla `commissions`
```sql
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id),
  source_payment_id UUID NOT NULL REFERENCES payments(id),
  amount NUMERIC(10, 2) NOT NULL,  -- 50% del pago
  status TEXT DEFAULT 'pending',   -- pending | paid | cancelled
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT
);
```

---

## 🚀 Instalación

### PASO 1: Ejecutar SQL en Supabase

1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Ejecuta el archivo `scripts/create-affiliate-system.sql`
3. Verifica que se crearon:
   - Columna `referred_by` en `profiles`
   - Tabla `commissions`
   - Función `handle_payment_commission()`
   - Trigger `trigger_create_commission_on_payment`

### PASO 2: Verificar Archivos

Los siguientes archivos ya están implementados:
- ✅ `src/middleware.ts` - Captura `?ref` y guarda en cookie
- ✅ `src/app/app/auth/register/page.tsx` - Lee cookie y guarda `referred_by`
- ✅ `src/lib/utils/referral.ts` - Utilidades para leer cookie
- ✅ `src/types/commissions.ts` - Tipos TypeScript

---

## 📖 Cómo Funciona

### Flujo Completo:

```
1. Usuario visita: https://tuapp.com/?ref=UUID_DEL_PARTNER
   ↓
2. Middleware detecta ?ref y guarda en cookie (30 días)
   ↓
3. URL se limpia: https://tuapp.com/ (sin ?ref)
   ↓
4. Usuario navega y eventualmente se registra
   ↓
5. Al registrarse, el código lee la cookie
   ↓
6. Se actualiza profiles.referred_by = UUID_DEL_PARTNER
   ↓
7. Usuario realiza un pago exitoso
   ↓
8. Trigger detecta el pago completado
   ↓
9. Busca si el usuario tiene referred_by
   ↓
10. Si tiene, calcula comisión (50% del pago)
   ↓
11. Inserta registro en commissions (status: 'pending')
```

---

## 🔧 Uso del Sistema

### Para Socios (Partners)

1. **Generar Link de Referido:**
   ```javascript
   const partnerId = "tu-uuid-aqui"
   const referralLink = `https://tuapp.com/?ref=${partnerId}`
   ```

2. **Compartir el Link:**
   - En redes sociales
   - Por email
   - En su página web
   - Etc.

### Para Administradores

1. **Ver Comisiones Pendientes:**
   ```sql
   SELECT * FROM commissions 
   WHERE status = 'pending' 
   ORDER BY created_at DESC;
   ```

2. **Marcar Comisión como Pagada:**
   ```sql
   UPDATE commissions 
   SET status = 'paid', paid_at = NOW() 
   WHERE id = 'commission-id';
   ```

---

## 📊 Consultas Útiles

### Ver Comisiones por Partner
```sql
SELECT 
  p.full_name as partner_name,
  COUNT(c.id) as total_commissions,
  SUM(c.amount) as total_amount,
  SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END) as pending_amount
FROM commissions c
JOIN profiles p ON p.id = c.partner_id
GROUP BY p.id, p.full_name
ORDER BY total_amount DESC;
```

### Ver Comisiones de un Partner Específico
```sql
SELECT 
  c.*,
  u.full_name as referred_user_name,
  p.amount_usd as payment_amount
FROM commissions c
JOIN profiles u ON u.id = c.referred_user_id
JOIN payments p ON p.id = c.source_payment_id
WHERE c.partner_id = 'partner-uuid-aqui'
ORDER BY c.created_at DESC;
```

### Ver Usuarios Referidos por un Partner
```sql
SELECT 
  id,
  full_name,
  email,
  created_at
FROM profiles
WHERE referred_by = 'partner-uuid-aqui'
ORDER BY created_at DESC;
```

---

## 🔒 Seguridad

### Políticas RLS Implementadas

1. **Commissions - SELECT:**
   - Los usuarios solo pueden ver sus propias comisiones (como partners)

2. **Commissions - INSERT:**
   - Solo el trigger puede insertar (usuarios no pueden crear comisiones manualmente)

3. **Commissions - UPDATE:**
   - Solo administradores pueden actualizar (marcar como pagadas)

4. **Profiles - UPDATE:**
   - Los usuarios pueden actualizar su propio perfil
   - `referred_by` solo se establece una vez durante el registro

---

## 🧪 Testing

### Probar el Flujo Completo:

1. **Obtener UUID de un usuario existente (será el partner):**
   ```sql
   SELECT id, full_name FROM profiles LIMIT 1;
   ```

2. **Visitar con link de referido:**
   ```
   http://localhost:3000/?ref=UUID_DEL_PARTNER
   ```

3. **Verificar cookie en navegador:**
   - DevTools > Application > Cookies
   - Debe ver `encuentra_ref=UUID_DEL_PARTNER`

4. **Registrar nuevo usuario:**
   - Ir a `/app/auth/register`
   - Completar formulario
   - Verificar en BD que `referred_by` está configurado

5. **Simular pago (o usar pago real):**
   - El usuario referido realiza un pago
   - Verificar que se creó registro en `commissions`

---

## ⚠️ Notas Importantes

1. **Cookie HttpOnly:**
   - La cookie NO es HttpOnly porque el cliente necesita leerla durante el registro
   - Esto es aceptable ya que solo contiene un UUID (no información sensible)

2. **Auto-referidos:**
   - El sistema previene que un usuario se refiera a sí mismo (trigger en SQL)

3. **Comisiones Duplicadas:**
   - El trigger solo se ejecuta cuando `status = 'completed'`
   - Si un pago se actualiza múltiples veces, solo crea comisión si cambia a 'completed'

4. **Monto de Comisión:**
   - Siempre es exactamente 50% (`amount_usd * 0.50`)
   - Se redondea a 2 decimales automáticamente (NUMERIC(10, 2))

---

## 🐛 Troubleshooting

### La cookie no se guarda
- Verifica que el middleware esté activo
- Revisa la consola del navegador para errores
- Asegúrate de que el UUID sea válido

### referred_by no se actualiza
- Verifica que la cookie exista antes del registro
- Revisa la consola del navegador para errores
- Verifica que el partner UUID existe en `profiles`

### Las comisiones no se crean
- Verifica que el trigger existe: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_commission_on_payment';`
- Verifica que la función existe: `SELECT * FROM pg_proc WHERE proname = 'handle_payment_commission';`
- Revisa los logs de PostgreSQL para errores del trigger

---

## ✅ Checklist de Implementación

- [x] SQL para tabla commissions y columna referred_by
- [x] Trigger de PostgreSQL para crear comisiones automáticamente
- [x] Middleware para capturar ?ref y guardar en cookie
- [x] Lógica de registro para leer cookie y guardar referred_by
- [x] Utilidades TypeScript para manejo de cookies
- [x] Tipos TypeScript para commissions
- [x] Políticas RLS para seguridad
- [x] Prevención de auto-referidos
- [x] Documentación completa

---

**¡El sistema está listo para usar!** 🎉

