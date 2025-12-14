# 🔧 Fix Admin en Producción

## ❌ Problema

Tu usuario admin funciona en local pero NO en producción (live). Esto significa que el campo `is_admin` no está configurado correctamente en tu base de datos de producción en Supabase.

## ✅ Solución

### Paso 1: Ejecutar Script SQL en Supabase Producción

1. Ve a tu **Supabase Dashboard** (producción)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia el contenido completo de `scripts/fix-admin-production.sql`
5. **⚠️ IMPORTANTE**: Reemplaza `'mantoniorodriguez94@gmail.com'` con tu email real si es diferente (aparece 2 veces en el script)
6. Ejecuta el script (Run)
7. Verifica que el resultado muestre: **"✅ ADMINISTRADOR COMPLETO"**

### Paso 2: Verificar Variables de Entorno en Producción

Asegúrate de que tu plataforma de hosting (Vercel, etc.) tenga configuradas estas variables:

- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase (opcional pero recomendado)

### Paso 3: Limpiar Cache y Re-iniciar Sesión

1. Cierra sesión completamente en la aplicación de producción
2. Limpia el cache del navegador (Ctrl+Shift+R o Cmd+Shift+R)
3. Inicia sesión nuevamente
4. Ve a `/app/dashboard/perfil`
5. Debe aparecer el badge "🔥 Administrador"
6. Debe aparecer el botón "Panel de Control Admin"

### Paso 4: Verificar Acceso al Panel Admin

1. Ve a `/app/admin`
2. Debe permitirte acceder sin redirigirte
3. Debe mostrar el dashboard administrativo

## 🐛 Troubleshooting

### Si el script muestra "Usuario no encontrado":

1. Verifica que el email sea correcto
2. Verifica que el usuario esté registrado en producción
3. Ejecuta este SQL para ver todos los usuarios:
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC;
   ```

### Si sigue sin funcionar después del script:

1. Verifica las variables de entorno en tu plataforma de hosting
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado (ayuda con RLS)
3. Revisa los logs de la aplicación en producción
4. Ejecuta el script de diagnóstico:
   ```sql
   SELECT 
     u.email,
     p.is_admin,
     (u.raw_user_meta_data->>'is_admin')::boolean as metadata_admin
   FROM auth.users u
   LEFT JOIN public.profiles p ON p.id = u.id
   WHERE u.email = 'TU_EMAIL_AQUI';
   ```

## 📝 Notas Importantes

- El script solo LEE y CONFIGURA `is_admin`, no modifica otros campos
- Las políticas RLS permiten que los usuarios vean su propio `is_admin`
- El código usa `service_role_key` como fallback si RLS bloquea la lectura
- En producción, siempre usa el script en el SQL Editor de Supabase Dashboard

## ✅ Checklist Final

- [ ] Script SQL ejecutado en producción
- [ ] Resultado muestra "✅ ADMINISTRADOR COMPLETO"
- [ ] Variables de entorno configuradas en hosting
- [ ] Cache del navegador limpiado
- [ ] Sesión cerrada y re-iniciada
- [ ] Badge "🔥 Administrador" visible en perfil
- [ ] Botón "Panel de Control Admin" visible
- [ ] Acceso a `/app/admin` funcionando

