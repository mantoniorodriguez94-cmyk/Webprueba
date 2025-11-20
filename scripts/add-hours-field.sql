-- Agregar campo hours a la tabla businesses si no existe
-- Este campo almacenará los horarios de atención del negocio

DO $$ 
BEGIN
    -- Verificar si la columna 'hours' ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'hours'
    ) THEN
        -- Agregar la columna hours
        ALTER TABLE businesses 
        ADD COLUMN hours TEXT;
        
        RAISE NOTICE 'Columna hours agregada exitosamente a la tabla businesses';
    ELSE
        RAISE NOTICE 'La columna hours ya existe en la tabla businesses';
    END IF;
END $$;

-- Comentario para documentar el campo
COMMENT ON COLUMN businesses.hours IS 'Horarios de atención del negocio en formato texto libre';


