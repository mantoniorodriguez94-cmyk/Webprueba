-- ============================================
-- SISTEMA COMPLETO DE PAGOS MANUALES
-- ============================================
-- Script completo para configurar pagos manuales con imágenes
-- Incluye: Tabla, RLS, Storage, Políticas

BEGIN;

-- ============================================
-- 1. TABLA: manual_payment_submissions
-- ============================================

-- Verificar si la tabla ya existe y ajustar columnas según sea necesario
DO $$
BEGIN
  -- Si la tabla no existe, crearla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'manual_payment_submissions'
  ) THEN
    -- Crear tabla nueva
    CREATE TABLE public.manual_payment_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
      plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
      amount_usd NUMERIC(10,2) NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('zelle', 'bank_transfer', 'other')),
      reference TEXT,
      screenshot_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES auth.users(id)
    );
  ELSE
    -- Tabla existe, agregar columnas faltantes si no existen
    
    -- Agregar reviewed_by si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name = 'reviewed_by'
    ) THEN
      ALTER TABLE public.manual_payment_submissions 
      ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
    END IF;

    -- Si existe receipt_url pero no screenshot_url, renombrar
    -- (Esto es por si acaso se creó con el nombre incorrecto)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name = 'receipt_url'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name = 'screenshot_url'
    ) THEN
      ALTER TABLE public.manual_payment_submissions 
      RENAME COLUMN receipt_url TO screenshot_url;
    END IF;
    
    -- Si existe receipt_url y screenshot_url (ambas), eliminar receipt_url después de copiar datos
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name = 'receipt_url'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name = 'screenshot_url'
    ) THEN
      -- Copiar datos de receipt_url a screenshot_url si screenshot_url está vacío
      UPDATE public.manual_payment_submissions 
      SET screenshot_url = receipt_url 
      WHERE (screenshot_url IS NULL OR screenshot_url = '') AND receipt_url IS NOT NULL;
      
      -- Eliminar la columna receipt_url
      ALTER TABLE public.manual_payment_submissions 
      DROP COLUMN receipt_url;
    END IF;

    -- Si no existe ninguna de las dos columnas, agregar screenshot_url
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'manual_payment_submissions'
      AND column_name IN ('screenshot_url', 'receipt_url')
    ) THEN
      ALTER TABLE public.manual_payment_submissions 
      ADD COLUMN screenshot_url TEXT NOT NULL DEFAULT '';
      
      -- Quitar el default después de agregarlo
      ALTER TABLE public.manual_payment_submissions 
      ALTER COLUMN screenshot_url DROP DEFAULT;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE public.manual_payment_submissions IS 'Pagos manuales pendientes de verificación';
COMMENT ON COLUMN public.manual_payment_submissions.screenshot_url IS 'URL del comprobante en Supabase Storage';

-- ============================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON public.manual_payment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_business_id ON public.manual_payment_submissions(business_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payment_submissions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_manual_payments_created_at ON public.manual_payment_submissions(created_at DESC);

-- ============================================
-- 3. HABILITAR RLS
-- ============================================

ALTER TABLE public.manual_payment_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLÍTICAS RLS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can insert own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Users can view own manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can view all manual payments" ON public.manual_payment_submissions;
DROP POLICY IF EXISTS "Admins can update all manual payments" ON public.manual_payment_submissions;

-- Política: Usuarios pueden INSERTAR sus propios pagos manuales
CREATE POLICY "Users can insert own manual payments"
  ON public.manual_payment_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden VER sus propios pagos manuales
CREATE POLICY "Users can view own manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admins pueden VER todos los pagos manuales
CREATE POLICY "Admins can view all manual payments"
  ON public.manual_payment_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Política: Admins pueden ACTUALIZAR todos los pagos manuales
CREATE POLICY "Admins can update all manual payments"
  ON public.manual_payment_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ============================================
-- 5. CREAR BUCKET DE STORAGE (si no existe)
-- ============================================
-- Nota: Esto debe ejecutarse desde el Dashboard de Supabase o usar la API
-- Aquí dejamos comentarios de cómo hacerlo manualmente

-- Desde Supabase Dashboard:
-- 1. Storage → Create bucket
-- 2. Nombre: payment_receipts
-- 3. Public: NO (privado)
-- 4. File size limit: 10MB (o el que prefieras)
-- 5. Allowed MIME types: image/*

-- ============================================
-- 6. CREAR BUCKET DE STORAGE
-- ============================================
-- NOTA IMPORTANTE: Los buckets de Storage deben crearse manualmente desde el Dashboard
-- o usando la API de Supabase. Este SQL intentará crearlo pero puede fallar si no tienes permisos.
-- Si falla, créalo manualmente (ver instrucciones en documentación).

-- Intentar crear bucket (puede fallar si no tienes permisos adecuados)
-- Si falla, créalo manualmente desde Supabase Dashboard → Storage → Create bucket

DO $$
BEGIN
  -- Verificar si el bucket ya existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment_receipts'
  ) THEN
    -- Intentar insertar el bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'payment_receipts',
      'payment_receipts',
      false, -- Bucket privado
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
    RAISE NOTICE 'Bucket payment_receipts creado exitosamente';
  ELSE
    RAISE NOTICE 'Bucket payment_receipts ya existe, actualizando configuración...';
    -- Actualizar configuración si ya existe
    UPDATE storage.buckets
    SET
      public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    WHERE id = 'payment_receipts';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'No se pudo crear/actualizar el bucket desde SQL. Créalo manualmente desde el Dashboard: Storage → Create bucket → payment_receipts (privado, 10MB, image/*)';
END $$;

-- ============================================
-- 7. POLÍTICAS DE STORAGE
-- ============================================
-- Estas políticas permiten:
-- - Usuarios autenticados subir archivos en su carpeta userId/*
-- - Usuarios ver solo sus propios archivos
-- - Admins ver todos los archivos

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

-- Política: Usuarios pueden INSERTAR archivos en su carpeta userId/*
CREATE POLICY "Users can upload own receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment_receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuarios pueden VER sus propios archivos
CREATE POLICY "Users can view own receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment_receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Admins pueden VER todos los archivos
CREATE POLICY "Admins can view all receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment_receipts' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Política: Usuarios pueden ELIMINAR sus propios archivos (opcional, para cleanup)
CREATE POLICY "Users can delete own receipts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment_receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la tabla existe y tiene los campos correctos
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'manual_payment_submissions'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'manual_payment_submissions';

-- Verificar que el bucket existe
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'payment_receipts';

