# 🗑️ Instrucciones para Habilitar Eliminación de Chats

## ⚠️ IMPORTANTE: Ejecutar Script en Supabase

Para que la funcionalidad de **eliminar chats** funcione correctamente, necesitas ejecutar un script SQL en tu base de datos de Supabase.

## 📝 Pasos para Habilitar la Eliminación

### 1. Accede a Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto "Encuentra"
3. Ve a la sección **SQL Editor** en el menú lateral

### 2. Ejecuta el Script
1. Abre el archivo `scripts/add-delete-policies.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** o presiona `Ctrl + Enter`

### 3. Verifica el Resultado
Deberías ver un mensaje como:
```
✅ Políticas de eliminación agregadas correctamente
🗑️ Los usuarios ahora pueden eliminar sus conversaciones
🗑️ Los dueños de negocios pueden eliminar sus conversaciones
♻️ Los mensajes se eliminan automáticamente con la conversación (CASCADE)
```

## 🎯 ¿Qué hace este script?

El script agrega políticas RLS (Row Level Security) que permiten:

1. **Para Usuarios Regulares:**
   - Pueden eliminar conversaciones donde ellos son el `user_id`
   - Al eliminar una conversación, todos sus mensajes se eliminan automáticamente

2. **Para Dueños de Negocios:**
   - Pueden eliminar conversaciones relacionadas con sus negocios
   - Al eliminar una conversación, todos sus mensajes se eliminan automáticamente

## ✅ Funcionalidades Implementadas

### 1. Botón de Atrás en Chats
- Cuando estás **dentro de un chat individual** → El botón de atrás te lleva a la lista de todos los chats
- Solo aparece cuando hay una conversación seleccionada

### 2. Botón de Eliminar Chat
- Aparece en cada conversación (botón con tres puntos ⋮)
- Al hacer clic muestra la opción "Eliminar chat"
- Solicita confirmación antes de eliminar
- Elimina la conversación y todos sus mensajes de la base de datos
- Actualiza la interfaz automáticamente

## 🔒 Seguridad

Las políticas RLS garantizan que:
- Los usuarios **solo pueden eliminar sus propias conversaciones**
- Los dueños de negocios **solo pueden eliminar conversaciones de sus negocios**
- Nadie puede eliminar conversaciones de otros usuarios
- La eliminación es permanente e irreversible

## 🧪 Pruebas

Después de ejecutar el script, prueba:

1. **Como Usuario Regular:**
   - Ve a "Mis Mensajes"
   - Abre un chat con un negocio
   - Haz clic en el botón ⋮
   - Selecciona "Eliminar chat"
   - Confirma la eliminación
   - Verifica que el chat desaparece

2. **Como Dueño de Negocio:**
   - Ve a "Mensajes" de tu negocio
   - Abre una conversación con un cliente
   - Haz clic en el botón ⋮
   - Selecciona "Eliminar chat"
   - Confirma la eliminación
   - Verifica que la conversación desaparece

## ❓ Problemas Comunes

### "No se pudo eliminar la conversación"
- **Causa:** Las políticas RLS no están configuradas
- **Solución:** Ejecuta el script `add-delete-policies.sql` en Supabase

### "Permission denied for table conversations"
- **Causa:** Tu usuario no tiene permisos en Supabase
- **Solución:** Asegúrate de estar logueado con el usuario correcto

### El chat no desaparece después de eliminarlo
- **Causa:** Error en la conexión o en la actualización del estado
- **Solución:** Recarga la página y verifica que el chat efectivamente se eliminó de la base de datos

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs de la consola del navegador (F12)
2. Los logs de Supabase en el Dashboard
3. Verifica que las políticas RLS se crearon correctamente con el query de verificación incluido en el script


