# Instrucciones: Sistema de Ubicación de Venezuela

## 1. Ejecutar Script SQL en Supabase

1. Ve a tu proyecto de Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `scripts/create-venezuela-locations.sql`
4. Ejecuta el script

Esto creará:
- Tabla `states` con 24 estados de Venezuela
- Tabla `municipalities` con todos los municipios organizados por estado
- Columnas nuevas en `businesses`: `state_id`, `municipality_id`, `address_details`
- Políticas RLS para acceso público a estados y municipios

## 2. Verificar

Después de ejecutar el script, verifica en la base de datos:

```sql
-- Contar estados (debe ser 24)
SELECT COUNT(*) FROM states;

-- Contar municipios (debe ser ~335)
SELECT COUNT(*) FROM municipalities;

-- Ver estructura de businesses
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN ('state_id', 'municipality_id', 'address_details');
```

## 3. Uso en Frontend

El componente `LocationSelector` ya está integrado en:
- `/app/dashboard/negocios/nuevo` (crear negocio)
- `/app/dashboard/negocios/[id]/editar` (editar negocio)

Los selectores son obligatorios. El mapa y coordenadas GPS ahora son opcionales.


