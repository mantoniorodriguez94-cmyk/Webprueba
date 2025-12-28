-- ============================================
-- SISTEMA DE AFILIADOS/REFERIDOS
-- ============================================
-- Este script crea la infraestructura para el sistema de referidos
-- Incluye: tabla commissions, columna referred_by en profiles, y trigger automático

BEGIN;

-- ============================================
-- 1. AGREGAR COLUMNA referred_by A LA TABLA profiles
-- ============================================

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.profiles.referred_by IS 'ID del socio/partner que refirió a este usuario';
  END IF;
END $$;

-- ============================================
-- 2. CREAR TABLA commissions
-- ============================================

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  paid_at TIMESTAMPTZ,
  notes TEXT
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_commissions_partner_id ON public.commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referred_user_id ON public.commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_source_payment_id ON public.commissions(source_payment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at DESC);

-- Comentarios
COMMENT ON TABLE public.commissions IS 'Comisiones generadas para socios/partners por referidos';
COMMENT ON COLUMN public.commissions.partner_id IS 'ID del socio que recibe la comisión';
COMMENT ON COLUMN public.commissions.referred_user_id IS 'ID del usuario referido que realizó el pago';
COMMENT ON COLUMN public.commissions.source_payment_id IS 'ID del pago que generó esta comisión';
COMMENT ON COLUMN public.commissions.amount IS 'Monto de la comisión (50% del pago)';
COMMENT ON COLUMN public.commissions.status IS 'Estado: pending (pendiente), paid (pagada), cancelled (cancelada)';

-- ============================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias comisiones (si son partners)
DROP POLICY IF EXISTS "Users can view their own commissions" ON public.commissions;
CREATE POLICY "Users can view their own commissions"
  ON public.commissions
  FOR SELECT
  USING (auth.uid() = partner_id);

-- Política: Solo el sistema (service role) puede insertar comisiones
DROP POLICY IF EXISTS "Service role can insert commissions" ON public.commissions;
CREATE POLICY "Service role can insert commissions"
  ON public.commissions
  FOR INSERT
  WITH CHECK (false); -- Solo el trigger puede insertar, no usuarios directos

-- Política: Solo admins pueden actualizar comisiones (marcar como pagadas)
DROP POLICY IF EXISTS "Admins can update commissions" ON public.commissions;
CREATE POLICY "Admins can update commissions"
  ON public.commissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 4. FUNCIÓN PARA GENERAR COMISIÓN AUTOMÁTICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_payment_commission()
RETURNS TRIGGER AS $$
DECLARE
  referred_by_user_id UUID;
  commission_amount NUMERIC(10, 2);
BEGIN
  -- Solo procesar si el pago está completado/exitoso
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Buscar si el usuario que hizo el pago fue referido por alguien
  SELECT referred_by INTO referred_by_user_id
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Si el usuario tiene un referidor, crear la comisión
  IF referred_by_user_id IS NOT NULL THEN
    -- Calcular comisión: 50% del monto del pago
    commission_amount := NEW.amount_usd * 0.50;

    -- Insertar la comisión
    INSERT INTO public.commissions (
      partner_id,
      referred_user_id,
      source_payment_id,
      amount,
      status
    ) VALUES (
      referred_by_user_id,
      NEW.user_id,
      NEW.id,
      commission_amount,
      'pending'
    );

    -- Log para debugging (opcional, puedes removerlo en producción)
    RAISE NOTICE 'Comisión creada: Partner %, Usuario %, Monto %, Comisión %',
      referred_by_user_id, NEW.user_id, NEW.amount_usd, commission_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER PARA EJECUTAR LA FUNCIÓN
-- ============================================

-- Eliminar trigger si existe (para evitar duplicados)
DROP TRIGGER IF EXISTS trigger_create_commission_on_payment ON public.payments;

-- Crear el trigger
CREATE TRIGGER trigger_create_commission_on_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.handle_payment_commission();

-- Comentario sobre el trigger
COMMENT ON FUNCTION public.handle_payment_commission() IS 
  'Trigger function que crea automáticamente comisiones (50% del pago) cuando un usuario referido completa un pago';

-- ============================================
-- 6. FUNCIÓN PARA EVITAR AUTO-REFERIDOS
-- ============================================
-- Opcional: Prevenir que un usuario se refiera a sí mismo

CREATE OR REPLACE FUNCTION public.check_self_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevenir que un usuario se refiera a sí mismo
  IF NEW.referred_by = NEW.id THEN
    RAISE EXCEPTION 'Un usuario no puede referirse a sí mismo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir auto-referidos
DROP TRIGGER IF EXISTS trigger_prevent_self_referral ON public.profiles;
CREATE TRIGGER trigger_prevent_self_referral
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION public.check_self_referral();

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas queries para verificar que todo se creó correctamente:

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'commissions';

-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_name = 'handle_payment_commission';

-- SELECT trigger_name 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_create_commission_on_payment';

