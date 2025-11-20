-- Crear buckets de almacenamiento para imágenes

-- Bucket para galería de negocios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-gallery',
  'business-gallery',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de promociones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions-images',
  'promotions-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para business-gallery

-- Permitir a todos ver las imágenes (bucket público)
CREATE POLICY "Public access to business gallery"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'business-gallery');

-- Solo el dueño del negocio puede subir imágenes a su carpeta
CREATE POLICY "Business owners can upload gallery images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'business-gallery' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Solo el dueño puede actualizar sus imágenes
CREATE POLICY "Business owners can update their gallery images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'business-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Solo el dueño puede eliminar sus imágenes
CREATE POLICY "Business owners can delete their gallery images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'business-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Políticas de seguridad para promotions-images

-- Permitir a todos ver las imágenes (bucket público)
CREATE POLICY "Public access to promotion images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'promotions-images');

-- Solo el dueño del negocio puede subir imágenes de promociones
CREATE POLICY "Business owners can upload promotion images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'promotions-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Solo el dueño puede actualizar imágenes de promociones
CREATE POLICY "Business owners can update promotion images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'promotions-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Solo el dueño puede eliminar imágenes de promociones
CREATE POLICY "Business owners can delete promotion images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'promotions-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON POLICY "Public access to business gallery" ON storage.objects IS 'Permite a todos ver las imágenes de la galería de negocios';
COMMENT ON POLICY "Business owners can upload gallery images" ON storage.objects IS 'Solo el dueño del negocio puede subir imágenes a la galería';
COMMENT ON POLICY "Public access to promotion images" ON storage.objects IS 'Permite a todos ver las imágenes de promociones';
COMMENT ON POLICY "Business owners can upload promotion images" ON storage.objects IS 'Solo el dueño del negocio puede subir imágenes de promociones';

