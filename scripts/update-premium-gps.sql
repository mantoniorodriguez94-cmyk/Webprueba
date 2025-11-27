    -- =====================================================
    -- Script de actualización: Sistema Premium y GPS
    -- Fecha: 2025-11-25
    -- Descripción: Agrega campos para Premium y coordenadas GPS
    -- =====================================================

    -- 1. Agregar campos de coordenadas GPS a la tabla businesses
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;

    -- Comentarios para documentación
    COMMENT ON COLUMN businesses.latitude IS 'Latitud de la ubicación del negocio (coordenada GPS)';
    COMMENT ON COLUMN businesses.longitude IS 'Longitud de la ubicación del negocio (coordenada GPS)';

    -- 2. El campo is_premium se almacena en user_metadata de auth.users
    -- No requiere cambios en tablas, pero documentamos la estructura esperada:
    -- user_metadata: {
    --   "full_name": "string",
    --   "role": "person" | "company",
    --   "allowed_businesses": number,
    --   "is_premium": boolean,
    --   "is_admin": boolean,
    --   "avatar_url": "string",
    --   "location": "string"
    -- }

    -- 3. Crear índices para mejorar búsquedas por ubicación GPS
    CREATE INDEX IF NOT EXISTS idx_businesses_coordinates 
    ON businesses(latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

    -- 4. Función auxiliar para calcular distancia entre dos puntos GPS (opcional)
    -- Útil para búsquedas "cerca de mí"
    CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
    )
    RETURNS DECIMAL AS $$
    DECLARE
    earth_radius DECIMAL := 6371; -- Radio de la tierra en km
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
    BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN earth_radius * c;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- =====================================================
    -- Notas de uso:
    -- 1. Los usuarios con is_premium = true pueden crear de 2-5 negocios
    -- 2. Los usuarios sin premium solo pueden crear 1 negocio
    -- 3. Al crear/editar un negocio, debe completarse AL MENOS:
    --    - Dirección (address) O
    --    - Coordenadas GPS (latitude + longitude)
    -- =====================================================






