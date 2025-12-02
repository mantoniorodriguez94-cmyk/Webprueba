-- ============================================
-- CREAR BUCKET PARA COMPROBANTES DE PAGO
-- ============================================
-- Este script crea el bucket de Supabase Storage para
-- almacenar capturas de pantalla de pagos manuales

-- Crear bucket 'payment_receipts' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_receipts', 'payment_receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de almacenamiento para el bucket

-- Política: Los usuarios autenticados pueden subir sus propios recibos
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment_receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden ver sus propios recibos
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment_receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden actualizar sus propios recibos
CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment_receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden eliminar sus propios recibos
CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment_receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Todos pueden leer recibos (bucket público para que los admins vean)
-- Ajusta esto según tu necesidad de privacidad
CREATE POLICY "Public receipts are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment_receipts');

-- Comentarios
COMMENT ON POLICY "Users can upload their own receipts" ON storage.objects IS 
  'Permite a usuarios subir recibos en su propia carpeta user_id/';

COMMENT ON POLICY "Users can view their own receipts" ON storage.objects IS 
  'Usuarios solo ven sus propios recibos';


