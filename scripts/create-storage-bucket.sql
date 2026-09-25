-- ============================================
-- CREAR BUCKET PARA COMPROBANTES DE PAGO
-- ============================================
-- Este script crea el bucket de Supabase Storage para
-- almacenar capturas de pantalla de pagos manuales

-- Crear bucket 'payment_receipts' si no existe.
--
-- PRIVADO, y no es un detalle de configuración: acá viven capturas de
-- transferencias con nombres y números de cuenta. Un bucket público en
-- Supabase sirve cada archivo por URL sin pedir autenticación a nadie.
--
-- Este script lo creaba con public = true. La base de producción está
-- privada —comprobado el 25/09— así que nunca llegó a correrse tal cual, o
-- se corrigió a mano después. Se arregla igual porque quedaba armado: quien
-- lo corriera para rehacer el bucket abría los comprobantes sin enterarse.
--
-- El panel NO necesita que sea público: PaymentReceiptImage y
-- AdminPaymentsClient los muestran con createSignedUrl a una hora.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_receipts', 'payment_receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

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

-- Acá había una política que daba SELECT sobre todos los comprobantes al rol
-- `public`, es decir a cualquiera, con el comentario "ajusta esto según tu
-- necesidad de privacidad". No hay ninguna necesidad de privacidad que
-- justifique publicar comprobantes de pago, así que no se ajusta: se quita.
--
-- Y se quita también de una base que ya la tenga, para que correr este script
-- deje el bucket cerrado en vez de sólo no volver a abrirlo.
DROP POLICY IF EXISTS "Public receipts are viewable" ON storage.objects;

-- Comentarios
COMMENT ON POLICY "Users can upload their own receipts" ON storage.objects IS 
  'Permite a usuarios subir recibos en su propia carpeta user_id/';

COMMENT ON POLICY "Users can view their own receipts" ON storage.objects IS 
  'Usuarios solo ven sus propios recibos';



