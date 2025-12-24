# Fix: Error al cargar conversaciones

## Problema
Error en consola: `Error cargando conversaciones: {}`

Esto ocurre porque:
1. La vista `conversation_details` no puede acceder a `auth.users` directamente
2. Necesitamos una tabla `profiles` pública para almacenar información de usuarios

## Solución

### 1. Ejecutar Script SQL en Supabase

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `scripts/fix-conversation-details-rls.sql`
4. Haz clic en **Run**

### 2. Qué hace el script

- ✅ Crea la tabla `profiles` si no existe
- ✅ Migra datos de `auth.users` a `profiles`
- ✅ Recrea la vista `conversation_details` usando `profiles` en vez de `auth.users`
- ✅ Configura políticas RLS apropiadas
- ✅ Crea trigger automático para sincronizar nuevos usuarios
- ✅ Configura índices para mejor rendimiento

### 3. Verificar

Después de ejecutar el script, deberías ver mensajes como:
```
✅ Vista conversation_details existe
📊 Perfiles en tabla profiles: X
✅ Políticas RLS configuradas
```

### 4. Probar en la aplicación

1. Recarga la página de mensajes (`/app/dashboard/mis-mensajes`)
2. El error debería desaparecer
3. Las conversaciones deberían cargarse correctamente

## Notas Técnicas

- La tabla `profiles` es pública y puede ser leída por todos los usuarios autenticados
- Los usuarios solo pueden modificar su propio perfil
- La sincronización con `auth.users` es automática mediante triggers
- La vista `conversation_details` ahora usa `security_invoker = true` para RLS


