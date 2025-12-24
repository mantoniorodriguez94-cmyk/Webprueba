# 🚀 Fix Admin en Producción - Método Rápido

## ⚡ Solución Rápida (Sin acceder a Supabase SQL Editor)

Si no tienes acceso fácil al SQL Editor de Supabase, puedes usar esta API route desde tu terminal o navegador.

### Paso 1: Configurar Variable de Entorno

Agrega esta variable de entorno en tu plataforma de hosting (Vercel, etc.):

```
ADMIN_SETUP_SECRET=tu-clave-secreta-aqui-12345
```

⚠️ **IMPORTANTE**: Usa una clave secreta fuerte. Puedes generar una con:
```bash
openssl rand -hex 32
```

### Paso 2: Hacer Deploy

Haz push de los cambios y espera a que se despliegue:
```bash
git push
```

### Paso 3: Llamar a la API

Una vez desplegado, ejecuta este comando desde tu terminal (o usa Postman/curl):

```bash
curl -X POST https://tu-dominio.com/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "tu-clave-secreta-aqui-12345",
    "email": "mantoniorodriguez94@gmail.com"
  }'
```

**Reemplaza:**
- `tu-dominio.com` con tu dominio real
- `tu-clave-secreta-aqui-12345` con la misma clave que configuraste en `ADMIN_SETUP_SECRET`
- `mantoniorodriguez94@gmail.com` con tu email real

### Paso 4: Verificar

Deberías recibir una respuesta:
```json
{
  "success": true,
  "message": "Usuario mantoniorodriguez94@gmail.com configurado como administrador exitosamente",
  "data": {
    "userId": "...",
    "email": "mantoniorodriguez94@gmail.com"
  }
}
```

### Paso 5: Limpiar y Reiniciar Sesión

1. Cierra sesión completamente en producción
2. Limpia el cache del navegador (Ctrl+Shift+R)
3. Inicia sesión nuevamente
4. Ve a `/app/dashboard/perfil`
5. Debe aparecer el badge "🔥 Administrador"

---

## 🔒 Método Alternativo: SQL Directo (Recomendado)

Si tienes acceso al SQL Editor de Supabase, este método es más seguro y directo:

1. Ve a **Supabase Dashboard** (producción)
2. Ve a **SQL Editor** > New Query
3. Copia y ejecuta el contenido de `scripts/fix-admin-production.sql`
4. Verifica que muestre "✅ ADMINISTRADOR COMPLETO"

---

## 🛡️ Seguridad

La API route requiere:
- ✅ `ADMIN_SETUP_SECRET` debe coincidir (configura esto en variables de entorno)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` debe estar configurado
- ✅ Solo se puede usar desde el servidor (no desde el cliente)

**Recomendación**: Después de configurar el admin, puedes eliminar o cambiar el `ADMIN_SETUP_SECRET` para mayor seguridad.

---

## 🐛 Troubleshooting

**Error: "Clave secreta inválida"**
- Verifica que `ADMIN_SETUP_SECRET` esté configurada en tu plataforma de hosting
- Asegúrate de usar la misma clave en el curl y en las variables de entorno

**Error: "Usuario no encontrado"**
- Verifica que el email sea correcto
- Verifica que el usuario esté registrado en producción

**Error: "Variables de entorno no configuradas"**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas





