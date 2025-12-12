-- ============================================
-- SISTEMA DE REPORTES (FASE 5)
-- ============================================
-- Este script crea las tablas para reportar negocios y reseñas

BEGIN;

-- ============================================
-- 1. TABLA: business_reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.business_reports IS 'Reportes de negocios por usuarios';
COMMENT ON COLUMN public.business_reports.status IS 'pending, reviewed, resolved, dismissed';

-- ============================================
-- 2. TABLA: review_reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.review_reports IS 'Reportes de reseñas por usuarios';
COMMENT ON COLUMN public.review_reports.status IS 'pending, reviewed, resolved, dismissed';

-- ============================================
-- 3. HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.business_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLÍTICAS RLS - business_reports
-- ============================================
-- Cualquiera puede ver reportes (para admin)
DROP POLICY IF EXISTS "Admins can view all business reports" ON public.business_reports;
CREATE POLICY "Admins can view all business reports"
  ON public.business_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Usuarios pueden crear reportes
DROP POLICY IF EXISTS "Users can create business reports" ON public.business_reports;
CREATE POLICY "Users can create business reports"
  ON public.business_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- 5. POLÍTICAS RLS - review_reports
-- ============================================
-- Cualquiera puede ver reportes (para admin)
DROP POLICY IF EXISTS "Admins can view all review reports" ON public.review_reports;
CREATE POLICY "Admins can view all review reports"
  ON public.review_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Usuarios pueden crear reportes
DROP POLICY IF EXISTS "Users can create review reports" ON public.review_reports;
CREATE POLICY "Users can create review reports"
  ON public.review_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_business_reports_business_id ON public.business_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reports_reporter_id ON public.business_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_business_reports_status ON public.business_reports(status);
CREATE INDEX IF NOT EXISTS idx_business_reports_created_at ON public.business_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON public.review_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_created_at ON public.review_reports(created_at DESC);

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  'business_reports' as table_name,
  COUNT(*) as total_reports
FROM public.business_reports
UNION ALL
SELECT 
  'review_reports' as table_name,
  COUNT(*) as total_reports
FROM public.review_reports;


