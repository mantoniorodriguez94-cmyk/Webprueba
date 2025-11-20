    -- Crear tabla de promociones para los negocios
    CREATE TABLE IF NOT EXISTS promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    price DECIMAL(10, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_price CHECK (price >= 0)
    );

    -- Índices para mejorar el rendimiento
    CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
    CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

    -- Función para actualizar updated_at automáticamente
    CREATE OR REPLACE FUNCTION update_promotions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger para actualizar updated_at
    CREATE TRIGGER trigger_update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotions_updated_at();

    -- Habilitar Row Level Security (RLS)
    ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad

-- Política para lectura: Todos pueden ver promociones activas (público, sin autenticación)
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  );

-- Política para lectura: Dueños pueden ver todas sus promociones (activas e inactivas)
CREATE POLICY "Owners can view all their promotions"
  ON promotions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Política para lectura: Admins pueden ver todas las promociones
CREATE POLICY "Admins can view all promotions"
  ON promotions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      SELECT (user_metadata->>'is_admin')::boolean 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = true
  );

    -- Política para inserción: Solo el dueño del negocio puede crear promociones
    CREATE POLICY "Dueños pueden crear promociones"
    ON promotions
    FOR INSERT
    WITH CHECK (
        business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

    -- Política para actualización: Solo el dueño del negocio puede actualizar sus promociones
    CREATE POLICY "Dueños pueden actualizar sus promociones"
    ON promotions
    FOR UPDATE
    USING (
        business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

    -- Política para eliminación: Solo el dueño del negocio puede eliminar sus promociones
    CREATE POLICY "Dueños pueden eliminar sus promociones"
    ON promotions
    FOR DELETE
    USING (
        business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

    -- Comentarios para documentación
    COMMENT ON TABLE promotions IS 'Tabla de promociones de los negocios';
    COMMENT ON COLUMN promotions.business_id IS 'ID del negocio al que pertenece la promoción';
    COMMENT ON COLUMN promotions.name IS 'Nombre de la promoción';
    COMMENT ON COLUMN promotions.image_url IS 'URL de la imagen de la promoción';
    COMMENT ON COLUMN promotions.price IS 'Precio de la promoción';
    COMMENT ON COLUMN promotions.start_date IS 'Fecha de inicio de la promoción';
    COMMENT ON COLUMN promotions.end_date IS 'Fecha de fin de la promoción';
    COMMENT ON COLUMN promotions.is_active IS 'Indica si la promoción está activa';

    -- Vista para contar promociones activas por negocio
    CREATE OR REPLACE VIEW business_active_promotions_count AS
    SELECT 
    business_id,
    COUNT(*) as active_promotions_count
    FROM promotions
    WHERE 
    is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
    GROUP BY business_id;

    COMMENT ON VIEW business_active_promotions_count IS 'Vista que cuenta las promociones activas por negocio';

