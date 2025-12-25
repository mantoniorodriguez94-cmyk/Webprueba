# Sistema de Ubicación para Venezuela

Este sistema implementa la normalización de ubicaciones de negocios usando Estados y Municipios de Venezuela.

## 📋 Scripts SQL a Ejecutar

Ejecuta estos scripts **EN ORDEN** en Supabase Dashboard → SQL Editor:

### 1. Crear Tablas de Ubicación
**Archivo:** `scripts/create-location-tables.sql`

Este script crea:
- Tabla `states` (Estados de Venezuela)
- Tabla `municipalities` (Municipios de Venezuela)
- Índices y políticas RLS

### 2. Poblar Datos de Venezuela
**Archivo:** `scripts/seed-venezuela-locations.sql`

Este script inserta:
- Los 24 estados de Venezuela
- Los principales municipios de cada estado (completo)

**Nota:** El script usa `ON CONFLICT DO NOTHING`, así que puedes ejecutarlo múltiples veces sin problemas.

### 3. Agregar Campos a Tabla Businesses
**Archivo:** `scripts/add-location-fields-to-businesses.sql`

Este script agrega:
- `state_id` (INTEGER, FK a states)
- `municipality_id` (INTEGER, FK a municipalities)
- `address_details` (TEXT, opcional para punto de referencia)

**Nota:** Los campos se agregan como NULL inicialmente para permitir migración gradual. Una vez que todos los negocios existentes tengan datos, puedes hacerlos NOT NULL.

## 🔧 Verificación

Después de ejecutar los scripts, verifica que todo esté correcto:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('states', 'municipalities');

-- Verificar conteo de estados y municipios
SELECT 
  s.name as estado,
  COUNT(m.id) as municipios
FROM states s
LEFT JOIN municipalities m ON m.state_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- Verificar que los campos se agregaron a businesses
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
  AND column_name IN ('state_id', 'municipality_id', 'address_details');
```

## 📝 Componente Frontend

El componente `LocationSelector.tsx` ya está creado e integrado en el formulario de creación de negocios.

**Ubicación:** `src/components/LocationSelector.tsx`

**Características:**
- Carga estados al montar
- Carga municipios dinámicamente según el estado seleccionado
- Validación de campos obligatorios
- Estados de carga y error
- UI moderna con Tailwind CSS

## 🎯 Uso en el Formulario

El componente se usa en `src/app/app/dashboard/negocios/nuevo/page.tsx`:

```tsx
<LocationSelector
  selectedStateId={stateId}
  selectedMunicipalityId={municipalityId}
  onStateChange={setStateId}
  onMunicipalityChange={setMunicipalityId}
  disabled={loading}
  required={true}
/>
```

## 📍 Campos en la Base de Datos

### Tabla `businesses` (actualizada):
- `state_id` (INTEGER, FK) - **Obligatorio** para nuevos negocios
- `municipality_id` (INTEGER, FK) - **Obligatorio** para nuevos negocios
- `address_details` (TEXT) - **Opcional** - Punto de referencia adicional
- `latitude` (DECIMAL) - **Opcional** - Coordenada GPS
- `longitude` (DECIMAL) - **Opcional** - Coordenada GPS

### Validaciones:
- ✅ Estado y Municipio son **obligatorios** al crear un negocio
- ✅ GPS (lat/lng) es **opcional**
- ✅ `address_details` es **opcional**

## 🚀 Próximos Pasos (Opcional)

1. **Migrar datos existentes**: Si tienes negocios existentes, puedes crear un script de migración para asignarles estado y municipio basado en su dirección actual.

2. **Hacer campos NOT NULL**: Una vez que todos los negocios tengan estado y municipio, puedes ejecutar:
```sql
ALTER TABLE businesses 
  ALTER COLUMN state_id SET NOT NULL,
  ALTER COLUMN municipality_id SET NOT NULL;
```

3. **Filtros por ubicación**: Ahora puedes implementar filtros en el dashboard para buscar negocios por estado o municipio.

