-- ============================================
-- LIMPIEZA AUTOMÁTICA DE PREMIUM Y DESTACADOS EXPIRADOS
-- ============================================
-- Esta función desactiva automáticamente:
-- 1. Negocios premium cuando premium_until < NOW()
-- 2. Negocios destacados cuando featured_until < NOW()
--
-- Debe ejecutarse diariamente (cron job o Supabase Edge Function)
-- También se puede llamar manualmente cuando sea necesario

BEGIN;

-- Función para limpiar premium y destacados expirados
CREATE OR REPLACE FUNCTION cleanup_expired_premium_and_featured()
RETURNS TABLE(
  premium_expired_count INTEGER,
  featured_expired_count INTEGER
) AS $$
DECLARE
  v_premium_count INTEGER := 0;
  v_featured_count INTEGER := 0;
BEGIN
  -- 1. Desactivar negocios premium expirados
  UPDATE public.businesses
  SET 
    is_premium = false
    -- Mantener premium_until para historial
  WHERE is_premium = true 
    AND premium_until IS NOT NULL
    AND premium_until < NOW();
  
  GET DIAGNOSTICS v_premium_count = ROW_COUNT;

  -- 2. Desactivar negocios destacados expirados
  UPDATE public.businesses
  SET 
    is_featured = false
    -- Mantener featured_until para historial
  WHERE is_featured = true 
    AND featured_until IS NOT NULL
    AND featured_until < NOW();
  
  GET DIAGNOSTICS v_featured_count = ROW_COUNT;

  -- 3. Marcar suscripciones premium como expiradas
  UPDATE public.business_subscriptions
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_date < NOW();

  -- Retornar conteos
  RETURN QUERY SELECT v_premium_count, v_featured_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_premium_and_featured IS 
'Limpia automáticamente negocios premium y destacados expirados. Retorna el número de negocios actualizados. Debe ejecutarse diariamente.';

-- Función simplificada que solo actualiza y no retorna valores (útil para triggers)
CREATE OR REPLACE FUNCTION cleanup_expired_premium_and_featured_simple()
RETURNS VOID AS $$
BEGIN
  -- Desactivar negocios premium expirados
  UPDATE public.businesses
  SET is_premium = false
  WHERE is_premium = true 
    AND premium_until IS NOT NULL
    AND premium_until < NOW();

  -- Desactivar negocios destacados expirados
  UPDATE public.businesses
  SET is_featured = false
  WHERE is_featured = true 
    AND featured_until IS NOT NULL
    AND featured_until < NOW();

  -- Marcar suscripciones premium como expiradas
  UPDATE public.business_subscriptions
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_premium_and_featured_simple IS 
'Versión simplificada que solo actualiza sin retornar valores. Útil para triggers o llamadas simples.';

COMMIT;

-- ============================================
-- PRUEBA DE LA FUNCIÓN
-- ============================================
-- Para probar, ejecuta:
-- SELECT * FROM cleanup_expired_premium_and_featured();
--
-- Esto retornará:
-- premium_expired_count | featured_expired_count
-- ----------------------+-----------------------
--                     5 |                     2
-- (Indica cuántos negocios fueron actualizados)

-- ============================================
-- CONFIGURACIÓN DE CRON JOB (SUPABASE)
-- ============================================
-- Para ejecutar automáticamente cada día a las 00:00 UTC:
-- 
-- En Supabase Dashboard > Database > Extensions:
-- 1. Instalar extensión pg_cron si no está instalada
-- 2. Ejecutar:
--
-- SELECT cron.schedule(
--   'cleanup-expired-premium-featured',
--   '0 0 * * *',  -- Todos los días a medianoche UTC
--   'SELECT cleanup_expired_premium_and_featured_simple();'
-- );
--
-- Para ver los cron jobs configurados:
-- SELECT * FROM cron.job;
--
-- Para eliminar un cron job:
-- SELECT cron.unschedule('cleanup-expired-premium-featured');

-- ============================================
-- ALTERNATIVA: EDGE FUNCTION + CRON EXTERNO
-- ============================================
-- También puedes crear una Edge Function en Supabase que llame a esta función
-- y configurar un cron job externo (Vercel Cron, GitHub Actions, etc.) para
-- llamar a la Edge Function diariamente.

