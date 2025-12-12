-- ============================================
-- SISTEMA BÁSICO DE INVITACIONES (FASE 9)
-- ============================================
-- Este script crea la tabla para el sistema de referidos

BEGIN;

-- ============================================
-- TABLA: referrals
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  invited_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Solo un registro por email invitado por invitador (o un registro por usuario invitado)
  UNIQUE(inviter_id, invited_email),
  UNIQUE(inviter_id, invited_id)
);

COMMENT ON TABLE public.referrals IS 'Sistema de referidos - Registro de invitaciones';
COMMENT ON COLUMN public.referrals.inviter_id IS 'Usuario que envió la invitación';
COMMENT ON COLUMN public.referrals.invited_email IS 'Email de la persona invitada (antes de registrarse)';
COMMENT ON COLUMN public.referrals.invited_id IS 'ID del usuario registrado que aceptó la invitación (se llena cuando se registra)';

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================
-- Usuarios pueden ver sus propios referidos
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = inviter_id);

-- Usuarios pueden crear referidos (invitaciones)
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Los usuarios pueden actualizar sus referidos (para agregar invited_id cuando alguien se registra)
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;
CREATE POLICY "Users can update own referrals"
  ON public.referrals
  FOR UPDATE
  USING (auth.uid() = inviter_id);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON public.referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_email ON public.referrals(invited_email);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_id ON public.referrals(invited_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  'referrals' as table_name,
  COUNT(*) as total_referrals
FROM public.referrals;


