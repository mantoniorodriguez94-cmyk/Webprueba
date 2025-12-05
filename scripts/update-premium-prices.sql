-- ============================================
-- ACTUALIZAR PRECIOS DE PLANES PREMIUM
-- ============================================
-- Actualiza los precios de los planes premium existentes

-- Actualizar precio del plan mensual a $1 USD
UPDATE public.premium_plans
SET price_usd = 1.00
WHERE billing_period = 'monthly';

-- Actualizar precio del plan anual a $10 USD
UPDATE public.premium_plans
SET price_usd = 10.00
WHERE billing_period = 'yearly';

-- Verificar los cambios
SELECT 
  name,
  price_usd,
  billing_period,
  is_active
FROM public.premium_plans
ORDER BY price_usd;

-- Resultado esperado:
-- Premium Mensual  | $1.00  | monthly
-- Premium Anual    | $10.00 | yearly



