# 🚀 Inicio Rápido - Actualización Premium y GPS

## ⚡ Pasos para Activar las Nuevas Funcionalidades

### 1️⃣ Actualizar Base de Datos (IMPORTANTE)

**Abrir Supabase Dashboard:**

1. Ir a [https://supabase.com](https://supabase.com)
2. Abrir tu proyecto
3. Ir a **SQL Editor** en el menú lateral
4. Crear una nueva query
5. Copiar y pegar el contenido de `scripts/update-premium-gps.sql`
6. Hacer clic en **Run** (▶️)

**Script a ejecutar:**

```sql
-- Agregar campos de coordenadas GPS
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_businesses_coordinates 
ON businesses(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

✅ **¡Listo!** La base de datos está actualizada.

---

### 2️⃣ Probar el Sistema

#### Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor iniciará en `http://localhost:3000`

---

## 🧪 Funcionalidades para Probar

### ✅ 1. Sistema Premium

**¿Cómo probar?**

1. Inicia sesión con un usuario tipo **negocio**
2. Ve a **Mis Negocios**
3. Intenta crear más de 1 negocio
4. **Resultado esperado:** Verás una alerta Premium

**Mensaje esperado:**
```
⭐ Para crear más negocios, únete al Plan Premium.

✨ Beneficios Premium:
• Crear de 2 a 5 negocios
• 1 semana en Destacados
• Borde dorado especial

Precio: $5 USD/mes
```

---

### ✅ 2. Convertir Usuario Persona → Negocio

**¿Cómo probar?**

1. Inicia sesión con un usuario tipo **persona**
2. Ve a **Perfil** (botón en barra inferior)
3. Haz clic en **"Convertirme en Usuario Negocio"**
4. Confirma en el modal
5. **Resultado esperado:** Tu cuenta se convierte a tipo negocio

---

### ✅ 3. Dirección y Ubicación GPS

**¿Cómo probar?**

1. Como usuario **negocio**, ve a **Crear Negocio**
2. Verás una sección **"Ubicación del Negocio"** con:
   - **Opción A:** Campo de dirección manual
   - **Opción O:** Coordenadas GPS
3. Prueba ambas opciones:
   - **Dirección:** Escribe "Calle 123, Ciudad"
   - **GPS:** Haz clic en "Usar mi ubicación actual"
4. **Resultado esperado:** Puedes usar cualquiera de las dos opciones

**Nota:** Debes completar AL MENOS UNA de las dos opciones.

---

### ✅ 4. Mensajería para Negocios

**¿Cómo probar?**

1. Inicia sesión como usuario **negocio**
2. Mira la **barra inferior**
3. **Resultado esperado:** Verás el botón "Mensajes"
4. Haz clic para acceder a tus mensajes

---

### ✅ 5. Nueva Página de Perfil

**¿Cómo probar?**

1. Haz clic en el botón **"Perfil"** en la barra inferior
2. **Resultado esperado:** Se abre una página completa con:
   - Tu información (avatar, nombre, tipo de cuenta)
   - Opciones según tu tipo de usuario
   - Sección de configuración
   - Botón de cerrar sesión

**Para usuario Persona:**
- Mis Mensajes
- Convertirme en Usuario Negocio
- Configuración

**Para usuario Negocio:**
- Mis Negocios
- Mensajes
- Tarjeta Premium (si no es premium)
- Configuración

---

## 🎯 Configuraciones Opcionales

### Crear un Usuario Premium Manualmente

Para probar las funciones premium sin integrar pagos:

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_premium": true, "allowed_businesses": 5}'::jsonb
WHERE email = 'tu-email@ejemplo.com';
```

Reemplaza `tu-email@ejemplo.com` con el email del usuario.

---

## 📱 Botones de la Barra Inferior

### Para Usuarios Persona:
1. **Inicio** - Dashboard principal
2. **Explorar** - Buscar negocios
3. **Mensajes** - Tus conversaciones
4. **Perfil** - Tu página de perfil

### Para Usuarios Negocio:
1. **Inicio** - Dashboard principal
2. **Negocios** - Gestión de tus negocios
3. **Mensajes** - Conversaciones con clientes
4. **Perfil** - Tu página de perfil

---

## ❓ Solución de Problemas

### Error: "No se encontró la columna latitude"

**Solución:** Ejecuta el script SQL en Supabase (Paso 1️⃣)

### El botón de búsqueda no se oculta en móvil

**Solución:** Limpia la caché del navegador y recarga

### No puedo convertir mi cuenta a negocio

**Solución:** Verifica que:
1. Estés logueado
2. Tu cuenta sea tipo "persona"
3. Tengas conexión a internet

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `RESUMEN_ACTUALIZACION_PREMIUM_GPS.md` - Resumen completo
- `scripts/update-premium-gps.sql` - Script SQL
- Comentarios en el código fuente

---

## ✅ Checklist de Verificación

- [ ] Script SQL ejecutado en Supabase
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Sistema Premium funcionando (alerta al crear más negocios)
- [ ] Conversión de cuenta persona → negocio funciona
- [ ] Formulario de negocio muestra campos GPS
- [ ] Mensajería visible para usuarios negocio
- [ ] Botón de búsqueda oculto en móvil
- [ ] Página de perfil completa accesible

---

## 🎉 ¡Todo Listo!

Si todos los checkboxes están marcados, **¡la actualización está completa!**

Las nuevas funcionalidades están activas y listas para usar.

---

**¿Necesitas ayuda?** Revisa los documentos de resumen o los comentarios en el código.

**¡Disfruta las nuevas funciones! 🚀✨**








